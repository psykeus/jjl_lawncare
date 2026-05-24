import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PublicMobileMenu } from "@/components/layout/public-mobile-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

const links = [
  ["Services", "/services"],
  ["Pricing", "/pricing"],
  ["Service Area", "/service-area"],
  ["Terms", "/terms"],
  ["Contact", "/contact"],
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur">
      <div className="container-page flex min-h-16 items-center justify-between gap-3 py-3">
        <BrandLogo />
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex" aria-label="Site navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <ButtonLink href="/auth/login" variant="ghost" className="hidden sm:inline-flex">
            Login
          </ButtonLink>
          <ButtonLink href="/request-quote" className="hidden min-[380px]:inline-flex">Request Quote</ButtonLink>
          <PublicMobileMenu />
        </div>
      </div>
    </header>
  );
}
