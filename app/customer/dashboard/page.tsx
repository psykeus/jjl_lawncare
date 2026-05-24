import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const [{ count: requestCount }, { data: estimates }, { data: invoices }, { data: jobs }] = await Promise.all([
    supabase.from("quote_requests").select("id", { count: "exact", head: true }),
    supabase.from("documents").select("id, document_number, status, total, expiration_date").eq("document_type", "estimate").order("created_at", { ascending: false }).limit(3),
    supabase.from("documents").select("id, document_number, status, balance_due, due_date").eq("document_type", "invoice").order("created_at", { ascending: false }).limit(3),
    supabase.from("jobs").select("id, status, scheduled_date, scheduled_start_time").order("scheduled_date", { ascending: true }).limit(3),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Customer dashboard</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">View requests, estimates, scheduled jobs, and invoices.</p>
        </div>
        <Link href="/request-quote" className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-[var(--primary-foreground)]">Request new quote</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-[var(--muted-foreground)]">Requests</div><div className="mt-2 text-3xl font-black">{requestCount ?? 0}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Estimates</div><div className="mt-2 text-3xl font-black">{estimates?.length ?? 0}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Invoices</div><div className="mt-2 text-3xl font-black">{invoices?.length ?? 0}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Jobs</div><div className="mt-2 text-3xl font-black">{jobs?.length ?? 0}</div></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><h2 className="text-xl font-bold">Recent estimates</h2><div className="mt-4 grid gap-3 text-sm">{(estimates ?? []).map((estimate) => <Link key={estimate.id} href={`/customer/estimates/${estimate.id}`} className="rounded-lg bg-[var(--muted)] p-3"><strong>{estimate.document_number}</strong><br />{formatCurrency(Number(estimate.total))} · {estimate.status} · expires {formatDate(estimate.expiration_date)}</Link>)}{estimates?.length ? null : <p className="text-[var(--muted-foreground)]">No estimates yet.</p>}</div></Card>
        <Card><h2 className="text-xl font-bold">Recent invoices</h2><div className="mt-4 grid gap-3 text-sm">{(invoices ?? []).map((invoice) => <Link key={invoice.id} href={`/customer/invoices/${invoice.id}`} className="rounded-lg bg-[var(--muted)] p-3"><strong>{invoice.document_number}</strong><br />Balance {formatCurrency(Number(invoice.balance_due))} · {invoice.status} · due {formatDate(invoice.due_date)}</Link>)}{invoices?.length ? null : <p className="text-[var(--muted-foreground)]">No invoices yet.</p>}</div></Card>
        <Card><h2 className="text-xl font-bold">Upcoming jobs</h2><div className="mt-4 grid gap-3 text-sm">{(jobs ?? []).map((job) => <div key={job.id} className="rounded-lg bg-[var(--muted)] p-3"><div className="flex items-center justify-between gap-3"><span>{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</span><StatusBadge status={job.status} /></div></div>)}{jobs?.length ? null : <p className="text-[var(--muted-foreground)]">No jobs scheduled yet.</p>}</div></Card>
      </div>
    </div>
  );
}
