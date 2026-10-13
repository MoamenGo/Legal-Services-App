import { describe, expect, it } from 'vitest';
import { parseBlocks } from './article-blocks';

describe('parseBlocks', () => {
  it('reads headings, paragraphs and lists', () => {
    expect(parseBlocks('## العنوان\nسطر أول\nسطر ثانٍ\n\n- بند\n- بند آخر\n### فرعي\nنص')).toEqual([
      { type: 'h2', text: 'العنوان' },
      { type: 'p', text: 'سطر أول سطر ثانٍ' },
      { type: 'ul', items: ['بند', 'بند آخر'] },
      { type: 'h3', text: 'فرعي' },
      { type: 'p', text: 'نص' },
    ]);
  });

  it('keeps markup as text', () => {
    expect(parseBlocks('<script>alert(1)</script>')).toEqual([
      { type: 'p', text: '<script>alert(1)</script>' },
    ]);
  });
});
