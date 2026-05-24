import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import type { AppRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

const navByRole: Record<AppRole, Array<[string, string]>> = {
  admin: [
    ["Dashboard", "/admin/dashboard"],
    ["Requests", "/admin/quote-requests"],
    ["Customers", "/admin/customers"],
    ["Estimates", "/admin/estimates"],
    ["Jobs", "/admin/jobs"],
    ["Map", "/admin/map"],
    ["Service Areas", "/admin/service-areas"],
    ["Invoices", "/admin/invoices"],
    ["Payments", "/admin/payments"],
    ["Expenses", "/admin/expenses"],
    ["Earnings", "/admin/earnings"],
    ["Services", "/admin/services"],
    ["Checklists", "/admin/checklists"],
    ["Terms", "/admin/terms"],
    ["Settings", "/admin/settings"],
  ],
  crew: [
    ["Dashboard", "/crew/dashboard"],
    ["My Jobs", "/crew/jobs"],
    ["Map", "/crew/map"],
    ["Earnings", "/crew/earnings"],
  ],
  customer: [
    ["Dashboard", "/customer/dashboard"],
    ["Properties", "/customer/properties"],
    ["Requests", "/customer/requests"],
    ["Estimates", "/customer/estimates"],
    ["Invoices", "/customer/invoices"],
    ["Account", "/customer/account"],
  ],
};

export function AppShell({ role, name, children }: { role: AppRole; name?: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="container-page flex min-h-16 items-center justify-between gap-4 py-3">
          <Link href={`/${role}/dashboard`} className="font-black text-[var(--primary)]">
            JJL Manager
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--muted-foreground)] sm:inline">{name ?? role}</span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container-page grid gap-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-[var(--border)] bg-white p-3 lg:sticky lg:top-4 lg:self-start">
          <nav className="grid gap-1">
            {navByRole[role].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
