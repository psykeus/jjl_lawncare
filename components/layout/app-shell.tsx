import { signOut } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { MobileBottomNav, MobileNavButton } from "@/components/layout/app-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppShell({ role, name, children }: { role: AppRole; name?: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] pb-20 lg:pb-0">
      <a href="#main-content" className="focus-ring sr-only fixed left-3 top-3 z-[100] rounded-lg bg-[var(--card)] px-4 py-2 font-bold text-[var(--foreground)] shadow-lg focus:not-sr-only">Skip to main content</a>
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
      <div className="container-page py-3 sm:py-4 lg:py-5">
        <main id="main-content" className="min-w-0">{children}</main>
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
