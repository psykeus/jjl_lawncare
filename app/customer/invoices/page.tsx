import Link from "next/link";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black">My invoices</h1><p className="mt-2 text-[var(--muted-foreground)]">View payment status and cash/Venmo instructions.</p></div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Invoice</th><th className="p-3">Total</th><th className="p-3">Balance</th><th className="p-3">Status</th><th className="p-3">Due</th></tr></thead>
          <tbody>
            {(invoices ?? []).map((invoice) => <tr key={invoice.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]"><td className="p-3 font-semibold"><Link href={`/customer/invoices/${invoice.id}`}>{invoice.document_number}</Link></td><td className="p-3">{formatCurrency(Number(invoice.total))}</td><td className="p-3">{formatCurrency(Number(invoice.balance_due))}</td><td className="p-3"><StatusBadge status={invoice.status} /></td><td className="p-3">{formatDate(invoice.due_date)}</td></tr>)}
            {invoices?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={5}>No invoices yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
