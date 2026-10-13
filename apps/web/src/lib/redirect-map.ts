// 301 rather than Next's default 308 for `permanent`, as AGENTS.md section 7 asks.
export type Redirect = { source: string; destination: string; statusCode: 301 };

/** Characters Next.js reads as path-pattern syntax; an old URL is matched literally. */
const PATTERN_CHARS = /[(){}:*+?\\]/g;
const literal = (path: string) => path.replace(PATTERN_CHARS, (char) => `\\${char}`);

/**
 * Parses docs/redirect-map.csv (`from,to` rows; `#` lines are comments) into Next.js redirects.
 * Throws on a malformed row so a bad map fails the build instead of silently dropping a URL.
 */
export function parseRedirectMap(csv: string): Redirect[] {
  const redirects: Redirect[] = [];
  const seen = new Set<string>();
  csv.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('#') || /^from\s*,\s*to$/i.test(line)) return;
    const [from = '', to = '', ...extra] = line.split(',').map((cell) => cell.trim());
    const where = `redirect-map.csv line ${index + 1}`;
    if (extra.length > 0 || !from || !to) throw new Error(`${where}: expected "from,to"`);
    if (!from.startsWith('/') || /[?#]/.test(from))
      throw new Error(`${where}: "from" must be a path without a query string`);
    if (!to.startsWith('/') && !/^https:\/\//.test(to))
      throw new Error(`${where}: "to" must be a path or an https URL`);

    // Next.js strips trailing slashes before matching, so the map should not depend on them.
    const path = from.length > 1 ? from.replace(/\/+$/, '') : from;
    // Old Arabic URLs may be listed either readable or percent-encoded; match both spellings.
    const spellings = new Set([path, encodeURI(safeDecode(path))]);
    for (const spelling of spellings) {
      if (seen.has(spelling)) throw new Error(`${where}: "${from}" is listed twice`);
      seen.add(spelling);
      redirects.push({ source: literal(spelling), destination: to, statusCode: 301 });
    }
  });
  return redirects;
}

function safeDecode(path: string) {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}
