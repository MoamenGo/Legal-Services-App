import { describe, expect, it } from 'vitest';
import { maskPhone, normalizeSaudiPhone } from './phone';

describe('normalizeSaudiPhone', () => {
  it.each([
    ['0551234567', '+966551234567'],
    ['551234567', '+966551234567'],
    ['+966551234567', '+966551234567'],
    ['00966551234567', '+966551234567'],
    ['966 55 123 4567', '+966551234567'],
    ['055-123-4567', '+966551234567'],
    ['٠٥٥١٢٣٤٥٦٧', '+966551234567'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeSaudiPhone(input)).toBe(expected);
  });

  it.each(['0112345678', '05512345', '+201001234567', '<script>', ''])('rejects %s', (input) => {
    expect(normalizeSaudiPhone(input)).toBeNull();
  });
});

describe('maskPhone', () => {
  it('hides the middle digits', () => {
    expect(maskPhone('+966551234567')).toBe('+9665****567');
  });
});
