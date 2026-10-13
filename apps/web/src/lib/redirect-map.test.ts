import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseRedirectMap } from './redirect-map';

describe('parseRedirectMap', () => {
  it('reads rows, skips comments and the header, and strips trailing slashes', () => {
    expect(
      parseRedirectMap(
        '# old site\nfrom,to\n/services/labor/,/ar/services/labor\n\n/en/old,https://example.com/en',
      ),
    ).toEqual([
      { source: '/services/labor', destination: '/ar/services/labor', statusCode: 301 },
      { source: '/en/old', destination: 'https://example.com/en', statusCode: 301 },
    ]);
  });

  it('matches Arabic paths written readable or percent-encoded, and escapes pattern syntax', () => {
    const [readable, encoded] = parseRedirectMap('/خدمات,/ar/services');
    expect(readable?.source).toBe('/خدمات');
    expect(encoded?.source).toBe('/%D8%AE%D8%AF%D9%85%D8%A7%D8%AA');
    expect(parseRedirectMap('/page(1):x,/ar')[0]?.source).toBe('/page\\(1\\)\\:x');
  });

  it('fails the build on malformed or duplicate rows', () => {
    expect(() => parseRedirectMap('services,/ar')).toThrow('line 1');
    expect(() => parseRedirectMap('/a?x=1,/ar')).toThrow('query string');
    expect(() => parseRedirectMap('/a,javascript:alert(1)')).toThrow('https URL');
    expect(() => parseRedirectMap('/a,/ar,/en')).toThrow('from,to');
    expect(() => parseRedirectMap('/a,/ar\n/a/,/en')).toThrow('twice');
  });

  it('accepts the committed map', () => {
    const csv = readFileSync(new URL('../../../../docs/redirect-map.csv', import.meta.url), 'utf8');
    expect(() => parseRedirectMap(csv)).not.toThrow();
  });
});
