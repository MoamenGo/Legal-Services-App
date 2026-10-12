import { describe, expect, it } from 'vitest';
import { leadInputSchema, type LeadInputRaw } from './lead';

const valid: LeadInputRaw = {
  name: 'محمد أحمد',
  phone: '0551234567',
  caseType: 'labor',
  message: 'أحتاج استشارة بخصوص عقد عمل',
  language: 'ar',
  privacyAccepted: true,
  turnstileToken: 'token',
};

describe('leadInputSchema', () => {
  it('accepts an Arabic lead and normalizes the phone', () => {
    const lead = leadInputSchema.parse(valid);
    expect(lead.phone).toBe('+966551234567');
    expect(lead.preferredContact).toBe('call');
    expect(lead.source).toEqual({});
  });

  it('rejects a non-Saudi phone', () => {
    expect(leadInputSchema.safeParse({ ...valid, phone: '+201001234567' }).success).toBe(false);
  });

  it('rejects a filled honeypot', () => {
    expect(leadInputSchema.safeParse({ ...valid, website: 'http://spam.example' }).success).toBe(
      false,
    );
  });

  it('requires privacy consent', () => {
    expect(leadInputSchema.safeParse({ ...valid, privacyAccepted: false }).success).toBe(false);
  });

  it('caps oversized input', () => {
    expect(leadInputSchema.safeParse({ ...valid, message: 'x'.repeat(5000) }).success).toBe(false);
  });
});
