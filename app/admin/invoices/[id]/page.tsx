import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { recordInvoicePayment } from "../actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; paid?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: invoice }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from("documents").select("*, customers(name, email), properties(address_line_1, city, state, zip)").eq("id", id).eq("document_type", "invoice").maybeSingle(),
    supabase.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    supabase.from("payments").select("*").eq("document_id", id).order("received_at", { ascending: false }),
  ]);
  if (!invoice) notFound();
  const customer = one(invoice.customers);
  const property = one(invoice.properties);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Invoice {invoice.document_number}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{customer?.name} — {property?.address_line_1}, {property?.city}</p>
        <div className="mt-3 flex gap-2"><StatusBadge status={invoice.status} /><span className="text-sm text-[var(--muted-foreground)]">Due {formatDate(invoice.due_date)}</span></div>
        {query.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
        {query.paid ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Payment recorded.</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Description</th><th className="p-3">Qty</th><th className="p-3">Unit</th><th className="p-3">Total</th></tr></thead>
              <tbody>{(items ?? []).map((item) => <tr key={item.id} className="border-t border-[var(--border)]"><td className="p-3">{item.description}</td><td className="p-3">{Number(item.quantity)}</td><td className="p-3">{formatCurrency(Number(item.unit_price))}</td><td className="p-3 font-semibold">{formatCurrency(Number(item.line_total))}</td></tr>)}</tbody>
            </table>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Payments</h2>
            <div className="mt-4 grid gap-2 text-sm">
              {(payments ?? []).map((payment) => <div key={payment.id} className="flex justify-between rounded-lg border border-[var(--border)] p-3"><span>{payment.method} · {formatDate(payment.received_at)}</span><span className="font-semibold">{formatCurrency(Number(payment.amount))}</span></div>)}
              {payments?.length ? null : <p className="text-[var(--muted-foreground)]">No payments recorded.</p>}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Totals</h2>
            <dl className="mt-4 grid gap-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(Number(invoice.subtotal))}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd>{formatCurrency(Number(invoice.tax_total))}</dd></div><div className="flex justify-between"><dt>Total</dt><dd>{formatCurrency(Number(invoice.total))}</dd></div><div className="flex justify-between"><dt>Paid</dt><dd>{formatCurrency(Number(invoice.amount_paid))}</dd></div><div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-black"><dt>Balance</dt><dd>{formatCurrency(Number(invoice.balance_due))}</dd></div></dl>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Record payment</h2>
            <form action={recordInvoicePayment} className="mt-4 grid gap-4">
              <input type="hidden" name="documentId" value={invoice.id} />
              <input type="hidden" name="jobId" value={invoice.job_id ?? ""} />
              <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" defaultValue={invoice.balance_due ?? invoice.total} required /></Field>
              <Field label="Method"><Select name="method"><option value="cash">Cash</option><option value="venmo">Venmo</option><option value="other">Other/manual</option></Select></Field>
              <Field label="Notes"><Textarea name="notes" /></Field>
              <Field label="Proof image/PDF"><Input name="proof" type="file" accept="image/*,application/pdf" /></Field>
              <Button type="submit">Record payment</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Payment instructions</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{invoice.payment_instructions || "No payment instructions configured."}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
