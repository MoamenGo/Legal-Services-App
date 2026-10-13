import { describe, expect, it } from 'vitest';
import { TURNSTILE_TEST_SECRET, turnstileSecret } from './turnstile';
import { uuidv7 } from './uuid';

describe('uuidv7', () => {
  it('is a version 7 UUID', () => {
    expect(uuidv7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('sorts by creation time', () => {
    expect(uuidv7(1_000) < uuidv7(2_000)).toBe(true);
  });
});

describe('turnstileSecret', () => {
  it('prefers the configured secret', () => {
    expect(turnstileSecret({ TURNSTILE_SECRET_KEY: 's' }, '1x00000000000000000000AA')).toBe('s');
  });

  it('falls back to the test secret only with the test site key', () => {
    expect(turnstileSecret({}, '1x00000000000000000000AA')).toBe(TURNSTILE_TEST_SECRET);
    expect(turnstileSecret({}, '0x4AAAAAAA-real-key')).toBeUndefined();
  });
});
