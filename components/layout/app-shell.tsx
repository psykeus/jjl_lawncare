import { signOut } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { DesktopSidebarNav, MobileBottomNav, MobileNavButton } from "@/components/layout/app-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppShell({ role, name, children }: { role: AppRole; name?: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur">
        <div className="container-page flex min-h-16 items-center justify-between gap-3 py-3">
          <BrandLogo href={`/${role}/dashboard`} />
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden max-w-40 truncate text-[var(--muted-foreground)] sm:inline">{name ?? role}</span>
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
            <MobileNavButton role={role} />
          </div>
        </div>
      </header>
      <div className="container-page grid gap-6 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-6">
        <DesktopSidebarNav role={role} />
        <main className="min-w-0">{children}</main>
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
