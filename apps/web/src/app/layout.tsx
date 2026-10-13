/** The real `<html>` lives in `[locale]/layout.tsx`; this only satisfies Next's root layout. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
