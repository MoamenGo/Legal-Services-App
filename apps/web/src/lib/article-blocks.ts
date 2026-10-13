export type Block = { type: 'h2' | 'h3' | 'p'; text: string } | { type: 'ul'; items: string[] };

/**
 * Article bodies are plain text: blank lines split paragraphs, `## `/`### ` start headings and `- `
 * starts a list item. Rendering React elements from this, never HTML, rules out script injection
 * without a sanitizer (ADR 0005).
 */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    if (list.length) blocks.push({ type: 'ul', items: list });
    paragraph = [];
    list = [];
  };
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (line.startsWith('### ')) {
      flush();
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
    } else if (/^[-•*] /.test(line)) {
      if (paragraph.length) flush();
      list.push(line.slice(2).trim());
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
