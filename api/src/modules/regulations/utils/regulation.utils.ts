export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function htmlToPlainText(html: string): string {
  return String(html ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lightweight server-side HTML allowlist sanitizer for regulation bodies. */
export function sanitizeRegulationHtml(input: string): string {
  const raw = String(input ?? '').trim();
  if (!raw) {
    return '<p></p>';
  }

  // Strip dangerous tags entirely.
  let html = raw
    .replace(/<\/?(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

  // Only keep safe href/src protocols.
  html = html.replace(
    /\s(href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (_match, attr: string, _quoted: string, doubleValue?: string, singleValue?: string) => {
      const value = (doubleValue ?? singleValue ?? '').trim();
      if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('/uploads/') ||
        value.startsWith('#') ||
        value.startsWith('mailto:')
      ) {
        return ` ${attr}="${value.replaceAll('"', '')}"`;
      }
      return '';
    },
  );

  return html.slice(0, 500_000) || '<p></p>';
}
