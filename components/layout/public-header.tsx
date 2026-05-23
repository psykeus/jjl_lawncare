import Link from "next/link";
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
    <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="container-page flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="font-black tracking-tight text-[var(--primary)]">
          JJL Lawn Services
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/auth/login" variant="ghost" className="hidden sm:inline-flex">
            Login
          </ButtonLink>
          <ButtonLink href="/request-quote">Request Quote</ButtonLink>
        </div>
      </div>
    </header>
  );
}
