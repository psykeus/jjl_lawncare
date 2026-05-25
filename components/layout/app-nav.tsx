"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { AppRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navGroupsByRole, quickNavByRole, type NavGroup } from "./nav-config";

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
        "focus-ring block rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
      )}
    >
      {label}
    </Link>
  );
}

function NavGroupSection({ group, defaultOpen = false, onNavigate }: { group: NavGroup; defaultOpen?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const panelId = useId();
  const active = group.items.some((item) => isActive(pathname, item.href));
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? (defaultOpen || active);

  return (
    <section className="grid gap-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setUserOpen(open ? false : true)}
        className="focus-ring flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <span>{group.label}</span>
        <span className="flex items-center gap-1 text-[0.65rem] tracking-normal">
          {group.items.length}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-180" : "rotate-0")} aria-hidden="true" />
        </span>
      </button>
      <div id={panelId} className={cn("gap-1 pl-2", open ? "grid" : "hidden")}>
        {group.items.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} onClick={onNavigate} />
        ))}
      </div>
    </section>
  );
}

export function MobileNavButton({ role }: { role: AppRole }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const dashboardHref = `/${role}/dashboard`;
  const menuGroups = navGroupsByRole[role]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.href !== dashboardHref) }))
    .filter((group) => group.items.length > 0);

  function closeMenu({ restoreFocus = true } = {}) {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;

    window.requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>("button, a")?.focus());

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || containerRef.current?.contains(target)) return;
      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button ref={triggerRef} type="button" variant="outline" size="sm" onClick={() => (open ? closeMenu({ restoreFocus: false }) : setOpen(true))} aria-expanded={open} aria-haspopup="dialog" aria-label="Open navigation menu">
        <Menu className="h-4 w-4" aria-hidden="true" />
        Menu
      </Button>
      {open ? (
        <div ref={menuRef} className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl" role="dialog" aria-modal="false" aria-label="Navigation menu">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">JJ&amp;L</p>
                <p className="text-lg font-black">{role === "admin" ? "Admin" : role === "crew" ? "Crew" : "Customer"} menu</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => closeMenu()} aria-label="Close navigation menu" className="px-2">
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav className="grid gap-3 pb-2" aria-label="Navigation links">
              <NavLink href={dashboardHref} label="Dashboard" onClick={() => closeMenu({ restoreFocus: false })} />
              {menuGroups.map((group, index) => (
                <NavGroupSection key={group.label} group={group} defaultOpen={index === 0} onNavigate={() => closeMenu({ restoreFocus: false })} />
              ))}
            </nav>
          </div>
      ) : null}
    </div>
  );
}

export function MobileBottomNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = quickNavByRole[role];

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 px-2 pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden" aria-label="Quick navigation">
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
