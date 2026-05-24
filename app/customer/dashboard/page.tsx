import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Customer portal"
        title="Customer dashboard"
        description="View requests, estimates, scheduled jobs, and invoices."
        actions={<ButtonLink href="/request-quote">Request new quote</ButtonLink>}
      />

      <StatGrid>
        <StatCard label="Requests" value={requestCount ?? 0} hint="Quote requests" href="/customer/requests" />
        <StatCard label="Estimates" value={estimates?.length ?? 0} hint="Recent estimates" href="/customer/estimates" />
        <StatCard label="Invoices" value={invoices?.length ?? 0} hint="Recent invoices" href="/customer/invoices" />
        <StatCard label="Jobs" value={jobs?.length ?? 0} hint="Scheduled work" href="/customer/requests" />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card><h2 className="text-lg font-bold sm:text-xl">Recent estimates</h2><div className="mt-3 grid gap-2 text-sm">{(estimates ?? []).map((estimate) => <Link key={estimate.id} href={`/customer/estimates/${estimate.id}`} className="grid gap-2 rounded-xl bg-[var(--muted)] p-3 hover:brightness-95"><div className="flex items-center justify-between gap-3"><strong>{estimate.document_number}</strong><StatusBadge status={estimate.status} /></div><span>{formatCurrency(Number(estimate.total))} · expires {formatDate(estimate.expiration_date)}</span></Link>)}{estimates?.length ? null : <p className="text-[var(--muted-foreground)]">No estimates yet.</p>}</div></Card>
        <Card><h2 className="text-lg font-bold sm:text-xl">Recent invoices</h2><div className="mt-3 grid gap-2 text-sm">{(invoices ?? []).map((invoice) => <Link key={invoice.id} href={`/customer/invoices/${invoice.id}`} className="grid gap-2 rounded-xl bg-[var(--muted)] p-3 hover:brightness-95"><div className="flex items-center justify-between gap-3"><strong>{invoice.document_number}</strong><StatusBadge status={invoice.status} /></div><span>Balance {formatCurrency(Number(invoice.balance_due))} · due {formatDate(invoice.due_date)}</span></Link>)}{invoices?.length ? null : <p className="text-[var(--muted-foreground)]">No invoices yet.</p>}</div></Card>
        <Card><h2 className="text-lg font-bold sm:text-xl">Upcoming jobs</h2><div className="mt-3 grid gap-2 text-sm">{(jobs ?? []).map((job) => <div key={job.id} className="rounded-xl bg-[var(--muted)] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><span>{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</span><StatusBadge status={job.status} /></div></div>)}{jobs?.length ? null : <p className="text-[var(--muted-foreground)]">No jobs scheduled yet.</p>}</div></Card>
      </div>
    </div>
  );
}
