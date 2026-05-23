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
        <h1 className="text-3xl font-black">Invoice {invoice.document_number}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{property?.address_line_1}, {property?.city}, {property?.state} {property?.zip}</p>
        <div className="mt-3 flex gap-2"><StatusBadge status={invoice.status} /><span className="text-sm text-[var(--muted-foreground)]">Due {formatDate(invoice.due_date)}</span></div>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Description</th><th className="p-3">Qty</th><th className="p-3">Unit</th><th className="p-3">Total</th></tr></thead>
          <tbody>{(items ?? []).map((item) => <tr key={item.id} className="border-t border-[var(--border)]"><td className="p-3">{item.description}</td><td className="p-3">{Number(item.quantity)}</td><td className="p-3">{formatCurrency(Number(item.unit_price))}</td><td className="p-3 font-semibold">{formatCurrency(Number(item.line_total))}</td></tr>)}</tbody>
          <tfoot className="border-t border-[var(--border)] bg-white font-semibold"><tr><td className="p-3" colSpan={3}>Total</td><td className="p-3">{formatCurrency(Number(invoice.total))}</td></tr><tr><td className="p-3" colSpan={3}>Paid</td><td className="p-3">{formatCurrency(Number(invoice.amount_paid))}</td></tr><tr className="text-lg font-black"><td className="p-3" colSpan={3}>Balance</td><td className="p-3">{formatCurrency(Number(invoice.balance_due))}</td></tr></tfoot>
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
