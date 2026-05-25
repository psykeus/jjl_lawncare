import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="focus-ring sr-only fixed left-3 top-3 z-[100] rounded-lg bg-[var(--card)] px-4 py-2 font-bold text-[var(--foreground)] shadow-lg focus:not-sr-only">Skip to main content</a>
      <PublicHeader />
      <main id="main-content">{children}</main>
      <footer className="mt-16 border-t border-[var(--border)] bg-[var(--card)] py-8 text-center text-sm text-[var(--muted-foreground)]">
        <div className="container-page">JJL Lawn Services — safe, simple student-run lawn help.</div>
      </footer>
    </div>
  );
}
