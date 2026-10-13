import { describe, expect, it } from 'vitest';
import {
  attributionCookie,
  mergeTouch,
  parseAttribution,
  sourceFor,
  touchFrom,
} from './attribution';

const at = (path: string, referrer = '') =>
  touchFrom(new URL(`https://firm.example${path}`), referrer, 1_800_000_000_000);

describe('attribution', () => {
  it('reads campaign params and drops internal referrers', () => {
    const touch = at(
      '/ar/lp/labor-lawyer?utm_source=google&utm_campaign=labor&gclid=abc',
      'https://firm.example/ar',
    );
    expect(touch).toMatchObject({
      landingPage: '/ar/lp/labor-lawyer',
      utm_source: 'google',
      gclid: 'abc',
    });
    expect(touch.referrer).toBeUndefined();
    expect(at('/ar', 'https://www.google.com/').referrer).toBe('https://www.google.com/');
  });

  it('keeps the first touch and moves the last only on a new campaign click', () => {
    const organic = mergeTouch(null, at('/ar', 'https://www.google.com/'));
    expect(organic.first).toBe(organic.last);

    const ad = mergeTouch(organic, at('/ar/lp/labor-lawyer?gclid=G1&utm_campaign=labor'));
    expect(ad.first.referrer).toBe('https://www.google.com/');
    expect(ad.last.gclid).toBe('G1');

    // Later direct visits keep the gclid.
    expect(mergeTouch(ad, at('/ar/contact'))).toBe(ad);
  });

  it('round-trips through the cookie and survives a broken one', () => {
    const value = mergeTouch(null, at('/ar?utm_campaign=حملة'));
    const cookie = attributionCookie(value, true).split(';')[0]!;
    expect(parseAttribution(`other=1; ${cookie}`)).toEqual(value);
    expect(parseAttribution('lsa_attr=%7Bnot-json')).toBeNull();
    expect(attributionCookie(value, true)).toContain('Max-Age=7776000');
  });

  it('builds the lead source from the last touch, with first-touch fields when different', () => {
    const value = mergeTouch(mergeTouch(null, at('/ar', 'https://www.google.com/')), {
      ...at('/ar/lp/x?gclid=G2&utm_source=google&utm_campaign=c'),
      at: 1_800_000_100,
    });
    expect(sourceFor(value, at('/ar/thank-you'))).toMatchObject({
      gclid: 'G2',
      utm_campaign: 'c',
      landingPage: '/ar/lp/x',
      first_landingPage: '/ar',
      first_referrer: 'https://www.google.com/',
    });
    expect(sourceFor(null, at('/ar/contact?utm_source=bing'))).toMatchObject({
      utm_source: 'bing',
      landingPage: '/ar/contact',
    });
  });
});
