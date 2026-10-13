import { Suspense } from 'react';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

/** `/admin/article` (new) and `/admin/article?id=` (edit) keep the page a static shell. */
export default function AdminArticlePage() {
  return (
    <Suspense>
      <ArticleEditor />
    </Suspense>
  );
}
