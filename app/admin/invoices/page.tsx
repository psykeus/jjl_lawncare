import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("documents")
    .select("id, document_number, status, issue_date, due_date, total, balance_due, customers(name), properties(address_line_1, city)")
    .eq("document_type", "invoice")
    .order("created_at", { ascending: false });

  const rows = invoices ?? [];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Money" title="Invoices" description="Simple invoices with cash/Venmo payment tracking and outstanding balance review." />

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((invoice) => {
              const customer = one(invoice.customers);
              const property = one(invoice.properties);
              return (
                <Card key={invoice.id} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/invoices/${invoice.id}`} className="font-black text-[var(--primary)]">{invoice.document_number}</Link>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{customer?.name ?? "Unknown"}</p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "No address"}{property?.city ? `, ${property.city}` : ""}</p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Total</dt><dd>{formatCurrency(Number(invoice.total))}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Balance</dt><dd>{formatCurrency(Number(invoice.balance_due))}</dd></div>
                    <div className="col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Due</dt><dd>{formatDate(invoice.due_date)}</dd></div>
                  </dl>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Balance</th><th className="p-3">Status</th><th className="p-3">Due</th></tr></thead>
              <tbody>
                {rows.map((invoice) => {
                  const customer = one(invoice.customers);
                  const property = one(invoice.properties);
                  return <tr key={invoice.id} className="border-t border-[var(--border)] align-top hover:bg-[var(--muted)]"><td className="p-3 font-semibold"><Link href={`/admin/invoices/${invoice.id}`}>{invoice.document_number}</Link></td><td className="p-3">{customer?.name}</td><td className="p-3">{property?.address_line_1}, {property?.city}</td><td className="p-3 text-right tabular-nums">{formatCurrency(Number(invoice.total))}</td><td className="p-3 text-right tabular-nums">{formatCurrency(Number(invoice.balance_due))}</td><td className="p-3 whitespace-nowrap"><StatusBadge status={invoice.status} /></td><td className="p-3 whitespace-nowrap">{formatDate(invoice.due_date)}</td></tr>;
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No invoices yet" description="Invoices appear after completed jobs are billed." />
      )}
    </div>
  );
}
