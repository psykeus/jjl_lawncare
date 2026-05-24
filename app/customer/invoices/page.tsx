import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerInvoicesPage() {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("documents")
    .select("id, document_number, status, due_date, total, balance_due")
    .eq("document_type", "invoice")
    .order("created_at", { ascending: false });

  const rows = invoices ?? [];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Customer portal" title="My invoices" description="View payment status and cash/Venmo instructions." />

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((invoice) => (
              <Card key={invoice.id} className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3"><Link href={`/customer/invoices/${invoice.id}`} className="font-black text-[var(--primary)]">{invoice.document_number}</Link><StatusBadge status={invoice.status} /></div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Total</dt><dd>{formatCurrency(Number(invoice.total))}</dd></div>
                  <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Balance</dt><dd>{formatCurrency(Number(invoice.balance_due))}</dd></div>
                  <div className="col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Due</dt><dd>{formatDate(invoice.due_date)}</dd></div>
                </dl>
              </Card>
            ))}
          </div>
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Invoice</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Balance</th><th className="p-3">Status</th><th className="p-3">Due</th></tr></thead>
              <tbody>
                {rows.map((invoice) => <tr key={invoice.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]"><td className="p-3 font-semibold"><Link href={`/customer/invoices/${invoice.id}`}>{invoice.document_number}</Link></td><td className="p-3 text-right tabular-nums">{formatCurrency(Number(invoice.total))}</td><td className="p-3 text-right tabular-nums">{formatCurrency(Number(invoice.balance_due))}</td><td className="p-3 whitespace-nowrap"><StatusBadge status={invoice.status} /></td><td className="p-3 whitespace-nowrap">{formatDate(invoice.due_date)}</td></tr>)}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No invoices yet" description="Invoices will appear here after a job is completed and billed." />
      )}
    </div>
  );
}
