/**
 * HTML sanitization for content imported from untrusted sources (EPUB, pasted
 * text). The MVP stores chapters as plain text, so `toPlainText` is what the
 * parser actually calls. `sanitizeHtml` is the defense-in-depth path for a
 * future HTML-preserving reader and should be used before any `dangerouslySet-
 * InnerHTML` or render-as-HTML path.
 */

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&[a-z#0-9]+;/gi, (m) => ENTITY_MAP[m.toLowerCase()] ?? m);
}

/**
 * Strip ALL tags (and dangerous payloads) and return clean plain text.
 * This is what `parseEpub` persists in `Chapter.content` today.
 */
export function toPlainText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sanitize HTML while preserving a safe subset of tags. Use ONLY when you
 * genuinely want to render HTML (e.g. paragraph breaks). Strips event handlers,
 * `javascript:` URLs, iframes, scripts, styles, and any tag not in ALLOWED.
 */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'em',
  'strong',
  'i',
  'b',
  'u',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'span',
  'div',
]);

export function sanitizeHtml(html: string): string {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  return noScript.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return '';
    // Strip all attributes to drop event handlers + javascript: URLs.
    const closing = match.startsWith('</');
    return closing ? `</${lower}>` : `<${lower}>`;
  });
}
