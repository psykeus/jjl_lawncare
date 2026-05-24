import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main>{children}</main>
      <footer className="mt-16 border-t border-[var(--border)] bg-[var(--card)] py-8 text-center text-sm text-[var(--muted-foreground)]">
        <div className="container-page">JJL Lawn Services — safe, simple student-run lawn help.</div>
      </footer>
    </div>
  );
}
