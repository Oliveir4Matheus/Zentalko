/**
 * EPUB parser: ZIP → container.xml → OPF manifest/spine → XHTML chapters.
 *
 * We use JSZip (pure-JS) so we can parse directly from a Buffer without
 * touching the filesystem — lets us run inside Next route handlers /
 * serverless environments.
 */
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { toPlainText } from './sanitize';

export class InvalidEpubError extends Error {
  constructor(message = 'Invalid EPUB') {
    super(message);
    this.name = 'InvalidEpubError';
  }
}

export interface ParsedChapter {
  index: number;
  title: string;
  content: string;
  wordCount: number;
}

export interface ParsedAsset {
  path: string;
  mime: string;
  data: Buffer;
}

export interface ParsedBook {
  title: string;
  author: string;
  language: string;
  chapters: ParsedChapter[];
  assets: ParsedAsset[];
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function isZip(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  return ZIP_MAGIC.every((b, i) => buf[i] === b);
}

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  trimValues: true,
  // Hardening: do not parse declarations, do not coerce numeric attribute values,
  // and process entities conservatively. fast-xml-parser does not expand DOCTYPE
  // entities by default, but these flags reduce surface for crafted input.
  ignoreDeclaration: true,
  ignorePiTags: true,
  processEntities: true,
  htmlEntities: false,
  parseAttributeValue: false,
  parseTagValue: false,
});

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

const stripTags = toPlainText;

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractChapterTitle(html: string, fallback: string): string {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1?.[1]) return stripTags(h1[1]).slice(0, 200);
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(html);
  if (h2?.[1]) return stripTags(h2[1]).slice(0, 200);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (title?.[1]) return stripTags(title[1]).slice(0, 200);
  return fallback;
}

function joinPath(dir: string, ref: string): string {
  if (!dir) return ref;
  const stack = dir.split('/').filter(Boolean);
  stack.pop(); // drop file name, keep directory
  for (const part of ref.split('/')) {
    if (part === '..') {
      // Reject traversal that would escape the ZIP root (ZIP-slip defense).
      if (stack.length === 0) {
        throw new InvalidEpubError(`Path traversal rejected: ${dir} + ${ref}`);
      }
      stack.pop();
    } else if (part && part !== '.') {
      // Reject absolute paths and any path component containing a backslash
      // (Windows-style separators that some attackers use to bypass naive checks).
      if (part.includes('\\') || part.startsWith('/')) {
        throw new InvalidEpubError(`Invalid path component: ${part}`);
      }
      stack.push(part);
    }
  }
  return stack.join('/');
}

function dirnameOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i + 1);
}

export async function parseEpub(buffer: Buffer): Promise<ParsedBook> {
  if (!buffer || buffer.length === 0) {
    throw new InvalidEpubError('Empty buffer');
  }
  if (!isZip(buffer)) {
    throw new InvalidEpubError('Not a ZIP/EPUB container');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (err) {
    throw new InvalidEpubError(`ZIP load failed: ${(err as Error).message}`);
  }

  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) throw new InvalidEpubError('Missing META-INF/container.xml');
  const containerXml = await containerFile.async('string');
  const container = xml.parse(containerXml);
  const rootfiles = asArray(container?.container?.rootfiles?.rootfile);
  const opfPath = rootfiles[0]?.['@_full-path'];
  if (!opfPath) throw new InvalidEpubError('No rootfile in container.xml');

  const opfFile = zip.file(opfPath);
  if (!opfFile) throw new InvalidEpubError(`OPF not found at ${opfPath}`);
  const opfXml = await opfFile.async('string');
  const opf = xml.parse(opfXml);
  const pkg = opf?.package;
  if (!pkg) throw new InvalidEpubError('Invalid OPF package');

  const metadata = pkg.metadata ?? {};
  const title = (
    (typeof metadata['dc:title'] === 'string'
      ? metadata['dc:title']
      : metadata['dc:title']?.['#text']) ?? 'Untitled'
  ).toString();
  const author = (
    (typeof metadata['dc:creator'] === 'string'
      ? metadata['dc:creator']
      : metadata['dc:creator']?.['#text']) ?? ''
  ).toString();
  const language = (
    (typeof metadata['dc:language'] === 'string'
      ? metadata['dc:language']
      : metadata['dc:language']?.['#text']) ?? 'en'
  ).toString();

  const manifestItems = asArray(pkg.manifest?.item);
  const manifest = new Map<string, { href: string; mediaType: string }>();
  for (const item of manifestItems) {
    const id = item['@_id'];
    const href = item['@_href'];
    const mediaType = item['@_media-type'] ?? '';
    if (id && href) manifest.set(id, { href, mediaType });
  }

  const spineItems = asArray(pkg.spine?.itemref);
  const opfDir = dirnameOf(opfPath);

  // Collect image assets from the manifest. Images are referenced by relative
  // path from each chapter's XHTML, which we resolve to the ZIP-absolute path
  // used here as the asset key.
  const assets: ParsedAsset[] = [];
  const assetPaths = new Set<string>();
  for (const item of manifestItems) {
    const href = item['@_href'];
    const mediaType = (item['@_media-type'] ?? '') as string;
    if (!href || !mediaType.startsWith('image/')) continue;
    const assetPath = joinPath(`${opfDir}dummy`, href);
    if (assetPaths.has(assetPath)) continue;
    const f = zip.file(assetPath);
    if (!f) continue;
    const data = await f.async('nodebuffer');
    assets.push({ path: assetPath, mime: mediaType, data });
    assetPaths.add(assetPath);
  }

  const chapters: ParsedChapter[] = [];
  let index = 0;
  for (const ref of spineItems) {
    const idref = ref['@_idref'];
    const item = idref ? manifest.get(idref) : undefined;
    if (!item) continue;
    if (!/xhtml|html/i.test(item.mediaType) && !/\.x?html?$/i.test(item.href)) continue;
    const chapterPath = joinPath(`${opfDir}dummy`, item.href);
    const file = zip.file(chapterPath);
    if (!file) continue;
    const rawHtml = await file.async('string');
    const html = replaceImagesWithMarkers(rawHtml, chapterPath, assetPaths);
    const text = stripTags(html);
    if (!text) continue;
    chapters.push({
      index,
      title: extractChapterTitle(rawHtml, `Chapter ${index + 1}`),
      content: text,
      wordCount: countWords(text),
    });
    index += 1;
  }

  if (chapters.length === 0) {
    throw new InvalidEpubError('No readable chapters found in spine');
  }

  return { title, author, language, chapters, assets };
}

// Replace <img src="..."> with a plain-text marker that survives toPlainText().
// The marker's payload is the resolved ZIP-absolute path — the import step later
// rewrites it to a stable asset id.
function replaceImagesWithMarkers(
  html: string,
  chapterPath: string,
  assetPaths: Set<string>,
): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = /\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i.exec(tag);
    const raw = m?.[2] ?? m?.[3];
    if (!raw) return '';
    let src: string;
    try {
      src = decodeURIComponent(raw.trim());
    } catch {
      src = raw.trim();
    }
    if (/^(data|https?|blob|javascript):/i.test(src)) return '';
    let resolved: string;
    try {
      resolved = joinPath(chapterPath, src);
    } catch {
      return '';
    }
    if (!assetPaths.has(resolved)) return '';
    return `\n\n[[IMG:${resolved}]]\n\n`;
  });
}
