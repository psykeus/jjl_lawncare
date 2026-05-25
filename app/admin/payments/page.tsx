import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, status, received_at, notes, documents(id, document_number), profiles(name)")
    .order("received_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black">Payments</h1><p className="mt-2 text-[var(--muted-foreground)]">Confirmed cash, Venmo, and manual payments.</p></div>
      <div className="grid gap-3 md:hidden">
        {(payments ?? []).map((payment) => {
          const document = one(payment.documents);
          const profile = one(payment.profiles);
          return (
            <Card key={payment.id} className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-3"><div>{document ? <Link href={`/admin/invoices/${document.id}`} className="font-black text-[var(--primary)]">{document.document_number}</Link> : <strong>Manual payment</strong>}<p className="mt-1 text-sm text-[var(--muted-foreground)]">{payment.method} · {formatDate(payment.received_at)}</p></div><StatusBadge status={payment.status} /></div>
              <div className="flex items-center justify-between rounded-xl bg-[var(--muted)] p-3 text-sm"><span>Amount</span><strong>{formatCurrency(Number(payment.amount))}</strong></div>
              <p className="text-sm text-[var(--muted-foreground)]">Confirmed by {profile?.name ?? "—"}</p>
            </Card>
          );
        })}
        {payments?.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No payments recorded.</p></Card>}
      </div>
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Invoice</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Confirmed by</th><th className="p-3">Received</th></tr></thead>
          <tbody>
            {(payments ?? []).map((payment) => {
              const document = one(payment.documents);
              const profile = one(payment.profiles);
              return <tr key={payment.id} className="border-t border-[var(--border)]"><td className="p-3 font-semibold">{document ? <Link href={`/admin/invoices/${document.id}`}>{document.document_number}</Link> : "—"}</td><td className="p-3">{formatCurrency(Number(payment.amount))}</td><td className="p-3">{payment.method}</td><td className="p-3"><StatusBadge status={payment.status} /></td><td className="p-3">{profile?.name ?? "—"}</td><td className="p-3">{formatDate(payment.received_at)}</td></tr>;
            })}
            {payments?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No payments recorded.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
