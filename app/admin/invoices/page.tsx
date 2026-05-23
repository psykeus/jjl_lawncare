import Link from "next/link";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black">Invoices</h1><p className="mt-2 text-[var(--muted-foreground)]">Simple invoices with cash/Venmo payment tracking.</p></div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Total</th><th className="p-3">Balance</th><th className="p-3">Status</th><th className="p-3">Due</th></tr></thead>
          <tbody>
            {(invoices ?? []).map((invoice) => {
              const customer = one(invoice.customers);
              const property = one(invoice.properties);
              return <tr key={invoice.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]"><td className="p-3 font-semibold"><Link href={`/admin/invoices/${invoice.id}`}>{invoice.document_number}</Link></td><td className="p-3">{customer?.name}</td><td className="p-3">{property?.address_line_1}, {property?.city}</td><td className="p-3">{formatCurrency(Number(invoice.total))}</td><td className="p-3">{formatCurrency(Number(invoice.balance_due))}</td><td className="p-3"><StatusBadge status={invoice.status} /></td><td className="p-3">{formatDate(invoice.due_date)}</td></tr>;
            })}
            {invoices?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={7}>No invoices yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
