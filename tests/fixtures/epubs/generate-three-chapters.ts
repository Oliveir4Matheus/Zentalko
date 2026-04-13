/**
 * Generates tests/fixtures/epubs/three-chapters.epub from the manifest.
 * Run with: npx tsx tests/fixtures/epubs/generate-three-chapters.ts
 */
import JSZip from 'jszip';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const manifest = JSON.parse(
  readFileSync(join(__dirname, 'three-chapters.manifest.json'), 'utf8'),
) as {
  title: string;
  author: string;
  language: string;
  chapters: Array<{ index: number; title: string; wordCount: number }>;
};

function lorem(words: number): string {
  const pool = [
    'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'a', 'lazy', 'dog',
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
    'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
    'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
    'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
    'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat',
    'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
    'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum',
  ];
  const out: string[] = [];
  for (let i = 0; i < words; i++) {
    out.push(pool[i % pool.length]!);
  }
  // Sprinkle sentence punctuation so tokenizers work.
  return out
    .map((w, i) => (i > 0 && i % 12 === 0 ? `. ${w.charAt(0).toUpperCase()}${w.slice(1)}` : w))
    .join(' ')
    .concat('.');
}

function chapterXhtml(title: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${manifest.language}">
<head><title>${title}</title></head>
<body>
  <h1>${title}</h1>
  <p>${body}</p>
</body>
</html>`;
}

function opf(): string {
  const items = manifest.chapters
    .map(
      (c) =>
        `<item id="ch${c.index + 1}" href="ch${c.index + 1}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join('\n    ');
  const spine = manifest.chapters
    .map((c) => `<itemref idref="ch${c.index + 1}"/>`)
    .join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:three-chapters-sample</dc:identifier>
    <dc:title>${manifest.title}</dc:title>
    <dc:creator>${manifest.author}</dc:creator>
    <dc:language>${manifest.language}</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${items}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>`;
}

function ncx(): string {
  const points = manifest.chapters
    .map(
      (c, i) => `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${c.title}</text></navLabel>
      <content src="ch${c.index + 1}.xhtml"/>
    </navPoint>`,
    )
    .join('\n    ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:three-chapters-sample"/></head>
  <docTitle><text>${manifest.title}</text></docTitle>
  <navMap>
    ${points}
  </navMap>
</ncx>`;
}

async function main() {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );
  zip.file('OEBPS/content.opf', opf());
  zip.file('OEBPS/toc.ncx', ncx());
  for (const c of manifest.chapters) {
    zip.file(
      `OEBPS/ch${c.index + 1}.xhtml`,
      chapterXhtml(c.title, lorem(c.wordCount)),
    );
  }
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  const out = join(__dirname, 'three-chapters.epub');
  writeFileSync(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
