"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AppRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFlatNav, navGroupsByRole } from "./nav-config";

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href.endsWith("/dashboard")) return false;
  return pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
      )}
    >
      {label}
    </Link>
  );
}

export function DesktopSidebarNav({ role }: { role: AppRole }) {
  return (
    <aside className="hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm lg:sticky lg:top-4 lg:block lg:self-start">
      <nav className="grid gap-5" aria-label="Main navigation">
        {navGroupsByRole[role].map((group) => (
          <div key={group.label} className="grid gap-1">
            <p className="px-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{group.label}</p>
            {group.items.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNavButton({ role }: { role: AppRole }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open navigation menu">
        <Menu className="h-4 w-4" aria-hidden="true" />
        Menu
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close navigation menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(92vw,360px)] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">JJ&amp;L</p>
                <p className="text-lg font-black">{role === "admin" ? "Admin" : role === "crew" ? "Crew" : "Customer"} menu</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="px-2">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav className="grid gap-5" aria-label="Mobile navigation">
              {navGroupsByRole[role].map((group) => (
                <div key={group.label} className="grid gap-1">
                  <p className="px-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{group.label}</p>
                  {group.items.map((item) => (
                    <NavLink key={item.href} href={item.href} label={item.label} onClick={() => setOpen(false)} />
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MobileBottomNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = getFlatNav(role).slice(0, 4);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 px-2 py-2 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden" aria-label="Quick navigation">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring rounded-xl px-2 py-2 text-center text-[0.72rem] font-bold leading-tight",
                active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
              )}
            >
              {item.label.replace("Quote ", "")}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
