"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  ["Services", "/services"],
  ["Pricing", "/pricing"],
  ["Service Area", "/service-area"],
  ["Contact", "/contact"],
  ["Terms", "/terms"],
  ["Login", "/auth/login"],
];

export function PublicMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="md:hidden" aria-label="Open site menu">
        <Menu className="h-4 w-4" aria-hidden="true" />
        Menu
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Site menu">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close site menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-3 top-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">JJ&amp;L Lawncare</p>
                <p className="text-lg font-black">How can we help?</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close site menu" className="px-2">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav className="grid gap-1" aria-label="Mobile site navigation">
              {links.map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="focus-ring rounded-xl px-3 py-3 text-sm font-bold hover:bg-[var(--muted)]">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4">
              <ButtonLink href="/request-quote" onClick={() => setOpen(false)} className="w-full">
                Request Quote
              </ButtonLink>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
