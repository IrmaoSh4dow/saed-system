/**
 * Parses FRONTEND_URL (comma-separated) into absolute origins for CORS / Socket.IO.
 * Never returns "*".
 */
export function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function parseCorsOrigins(
  raw: string | undefined,
  fallback = 'http://localhost:5173',
): string[] {
  const source = (raw ?? fallback).trim() || fallback;
  const origins = source
    .split(',')
    .map((part) => normalizeOrigin(part))
    .filter((origin) => origin.length > 0);

  return origins.length > 0 ? [...new Set(origins)] : [normalizeOrigin(fallback)];
}
