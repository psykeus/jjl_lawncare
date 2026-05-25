import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; method?: string; q?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, status, received_at, notes, documents(id, document_number), profiles(name)")
    .order("received_at", { ascending: false });

  const query = (params.q ?? "").trim().toLowerCase();
  const methods = Array.from(new Set((payments ?? []).map((payment) => payment.method).filter(Boolean)));
  const rows = (payments ?? []).filter((payment) => {
    const document = one(payment.documents);
    const profile = one(payment.profiles);
    const matchesStatus = !params.status || params.status === "all" || payment.status === params.status;
    const matchesMethod = !params.method || params.method === "all" || payment.method === params.method;
    const matchesQuery = !query || [document?.document_number, profile?.name, payment.notes].some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesMethod && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black">Payments</h1><p className="mt-2 text-[var(--muted-foreground)]">Confirmed cash, Venmo, and manual payments.</p></div>
      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[160px_160px_1fr_auto] md:items-end">
          <Field label="Status"><Select name="status" defaultValue={params.status ?? "all"}><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="cash_pending">Cash pending</option><option value="venmo_pending">Venmo pending</option><option value="partially_paid">Partially paid</option><option value="paid">Paid</option><option value="problem">Problem</option><option value="refunded">Refunded</option></Select></Field>
          <Field label="Method"><Select name="method" defaultValue={params.method ?? "all"}><option value="all">All methods</option>{methods.map((method) => <option key={method} value={method}>{method}</option>)}</Select></Field>
          <Field label="Search"><Input name="q" defaultValue={params.q ?? ""} placeholder="Invoice, confirmer, notes" /></Field>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Showing {rows.length} of {(payments ?? []).length} payments.</p>
      </Card>
      <div className="grid gap-3 md:hidden">
        {rows.map((payment) => {
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
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No payments match these filters.</p></Card>}
      </div>
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Invoice</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Confirmed by</th><th className="p-3">Received</th></tr></thead>
          <tbody>
            {rows.map((payment) => {
              const document = one(payment.documents);
              const profile = one(payment.profiles);
              return <tr key={payment.id} className="border-t border-[var(--border)]"><td className="p-3 font-semibold">{document ? <Link href={`/admin/invoices/${document.id}`}>{document.document_number}</Link> : "—"}</td><td className="p-3">{formatCurrency(Number(payment.amount))}</td><td className="p-3">{payment.method}</td><td className="p-3"><StatusBadge status={payment.status} /></td><td className="p-3">{profile?.name ?? "—"}</td><td className="p-3">{formatDate(payment.received_at)}</td></tr>;
            })}
            {rows.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No payments match these filters.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
