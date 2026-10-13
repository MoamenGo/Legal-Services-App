import { parseBlocks } from '@/lib/article-blocks';

export function ArticleBody({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-lg leading-relaxed text-slate-800">
      {parseBlocks(text).map((block, i) =>
        block.type === 'ul' ? (
          <ul key={i} className="list-disc space-y-1 ps-6">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : block.type === 'h2' ? (
          <h2 key={i} className="pt-4 text-2xl font-bold text-brand-900">
            {block.text}
          </h2>
        ) : block.type === 'h3' ? (
          <h3 key={i} className="pt-2 text-xl font-bold text-brand-900">
            {block.text}
          </h3>
        ) : (
          <p key={i}>{block.text}</p>
        ),
      )}
    </div>
  );
}
