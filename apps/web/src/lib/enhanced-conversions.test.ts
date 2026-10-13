import { describe, expect, it } from 'vitest';
import { hashUserData } from './enhanced-conversions';

describe('hashUserData', () => {
  it('normalizes before hashing so every phone format matches', async () => {
    const a = await hashUserData(' Client@Example.COM ', '0551234567');
    const b = await hashUserData('client@example.com', '+966 55 123 4567');
    expect(a).toEqual(b);
    expect(a.sha256_phone_number).toMatch(/^[0-9a-f]{64}$/);
    // SHA-256 of "+966551234567"
    expect(a.sha256_phone_number).toBe(
      await crypto.subtle
        .digest('SHA-256', new TextEncoder().encode('+966551234567'))
        .then((d) =>
          Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join(''),
        ),
    );
  });

  it('omits what is missing', async () => {
    expect(await hashUserData(undefined, '0551234567')).not.toHaveProperty('sha256_email_address');
  });
});
