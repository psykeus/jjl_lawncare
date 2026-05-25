import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function CustomerInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: invoice }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("documents").select("*, properties(address_line_1, city, state, zip)").eq("id", id).eq("document_type", "invoice").maybeSingle(),
    supabase.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    supabase.from("payments").select("amount, method, status, received_at").eq("document_id", id).order("received_at", { ascending: false }),
  ]);
  if (!invoice) notFound();
  const property = one(invoice.properties);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/customer/invoices" className="text-sm font-bold text-[var(--primary)]">← Back to invoices</Link>
        <h1 className="mt-2 text-3xl font-black">Invoice {invoice.document_number}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{property?.address_line_1}, {property?.city}, {property?.state} {property?.zip}</p>
        <div className="mt-3 flex gap-2"><StatusBadge status={invoice.status} /><span className="text-sm text-[var(--muted-foreground)]">Due {formatDate(invoice.due_date)}</span></div>
      </div>
      <div className="grid gap-3 md:hidden">
        {(items ?? []).map((item) => (
          <Card key={item.id} className="grid gap-2 p-4">
            <h2 className="font-bold">{item.description}</h2>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm">
              <div><span className="block text-[var(--muted-foreground)]">Qty</span><strong>{Number(item.quantity)}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Unit</span><strong>{formatCurrency(Number(item.unit_price))}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Total</span><strong>{formatCurrency(Number(item.line_total))}</strong></div>
            </div>
          </Card>
        ))}
        <Card className="grid gap-2 p-4 text-sm">
          <div className="flex justify-between"><span>Total</span><strong>{formatCurrency(Number(invoice.total))}</strong></div>
          <div className="flex justify-between"><span>Paid</span><strong>{formatCurrency(Number(invoice.amount_paid))}</strong></div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2 text-lg font-black"><span>Balance</span><span>{formatCurrency(Number(invoice.balance_due))}</span></div>
        </Card>
      </div>

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Description</th><th className="p-3">Qty</th><th className="p-3">Unit</th><th className="p-3">Total</th></tr></thead>
          <tbody>{(items ?? []).map((item) => <tr key={item.id} className="border-t border-[var(--border)]"><td className="p-3">{item.description}</td><td className="p-3">{Number(item.quantity)}</td><td className="p-3">{formatCurrency(Number(item.unit_price))}</td><td className="p-3 font-semibold">{formatCurrency(Number(item.line_total))}</td></tr>)}</tbody>
          <tfoot className="border-t border-[var(--border)] bg-[var(--card)] font-semibold"><tr><td className="p-3" colSpan={3}>Total</td><td className="p-3">{formatCurrency(Number(invoice.total))}</td></tr><tr><td className="p-3" colSpan={3}>Paid</td><td className="p-3">{formatCurrency(Number(invoice.amount_paid))}</td></tr><tr className="text-lg font-black"><td className="p-3" colSpan={3}>Balance</td><td className="p-3">{formatCurrency(Number(invoice.balance_due))}</td></tr></tfoot>
        </table>
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Payment instructions</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{invoice.payment_instructions || "No payment instructions configured."}</p>
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Payments received</h2>
        <div className="mt-4 grid gap-2 text-sm">{(payments ?? []).map((payment, index) => <div key={index} className="flex justify-between rounded-lg border border-[var(--border)] p-3"><span>{payment.method} · {formatDate(payment.received_at)}</span><span className="font-semibold">{formatCurrency(Number(payment.amount))}</span></div>)}{payments?.length ? null : <p className="text-[var(--muted-foreground)]">No payments recorded yet.</p>}</div>
      </Card>
    </div>
  );
}
