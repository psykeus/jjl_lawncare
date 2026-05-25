import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
function serviceSummary(request: { services: RelatedRow<{ name: string | null }>; quote_request_services?: Array<{ services: RelatedRow<{ name: string | null }> }> | null }) {
  const names = (request.quote_request_services ?? []).map((row) => one(row.services)?.name).filter(Boolean) as string[];
  if (names.length > 1) return `${names[0]} + ${names.length - 1} add-on${names.length === 2 ? "" : "s"}`;
  return names[0] ?? one(request.services)?.name ?? "Quote request";
}

export default async function CustomerDashboardPage() {
  const supabase = await createClient();
  const [{ data: requests }, { data: estimates }, { data: invoices }, { data: jobs }, { data: properties }] = await Promise.all([
    supabase.from("quote_requests").select("id, status, created_at, preferred_dates, services(name), quote_request_services(services(name)), properties(address_line_1, city)").order("created_at", { ascending: false }).limit(5),
    supabase.from("documents").select("id, document_number, status, total, expiration_date").eq("document_type", "estimate").order("created_at", { ascending: false }).limit(4),
    supabase.from("documents").select("id, document_number, status, balance_due, due_date").eq("document_type", "invoice").order("created_at", { ascending: false }).limit(4),
    supabase.from("jobs").select("id, status, scheduled_date, scheduled_start_time, completed_at, services(name), properties(address_line_1, city)").order("scheduled_date", { ascending: false }).limit(8),
    supabase.from("properties").select("id").eq("active", true),
  ]);

  const requestRows = requests ?? [];
  const estimateRows = estimates ?? [];
  const invoiceRows = invoices ?? [];
  const jobRows = jobs ?? [];
  const openJobs = jobRows.filter((job) => !["completed", "paid", "cancelled", "declined"].includes(job.status));
  const completedJobs = jobRows.filter((job) => ["completed", "paid"].includes(job.status));
  const openInvoiceBalance = invoiceRows.reduce((sum, invoice) => sum + Number(invoice.balance_due ?? 0), 0);
  const nextJob = [...openJobs].sort((a, b) => String(a.scheduled_date ?? "9999").localeCompare(String(b.scheduled_date ?? "9999")))[0];
  const nextJobService = nextJob ? one(nextJob.services) : null;
  const nextJobProperty = nextJob ? one(nextJob.properties) : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Customer portal"
        title="Dashboard"
        description="Track requested work, upcoming jobs, completed history, estimates, and invoice balances."
        actions={<ButtonLink href="/request-quote">Request service</ButtonLink>}
      />

      {nextJob ? (
        <Link href="/customer/requests" className="focus-ring block rounded-3xl border border-[var(--border)] bg-[var(--primary)] p-4 text-[var(--primary-foreground)] shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">Next scheduled work</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{nextJobService?.name ?? "Lawn service"}</h2>
              <p className="mt-1 text-sm opacity-85">{formatDate(nextJob.scheduled_date)} {nextJob.scheduled_start_time ?? ""} · {nextJobProperty?.address_line_1 ?? "Saved property"}</p>
            </div>
            <span className="rounded-full bg-[var(--primary-foreground)] px-3 py-1 text-xs font-black text-[var(--primary)]">View details</span>
          </div>
        </Link>
      ) : null}

      <StatGrid>
        <StatCard label="Requests" value={requestRows.length} hint="Recent quote requests" href="/customer/requests" />
        <StatCard label="Open jobs" value={openJobs.length} hint="Scheduled/in progress" href="/customer/requests" />
        <StatCard label="Completed" value={completedJobs.length} hint="Recent job history" href="/customer/requests" />
        <StatCard label="Balance" value={formatCurrency(openInvoiceBalance)} hint="Open invoice balance" href="/customer/invoices" />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold sm:text-xl">Job tracker</h2>
            <Link href="/customer/requests" className="text-sm font-bold text-[var(--primary)]">All requests</Link>
          </div>
          <div className="mt-3 grid gap-2">
            {jobRows.map((job) => {
              const service = one(job.services);
              const property = one(job.properties);
              return (
                <div key={job.id} className="rounded-2xl border border-[var(--border)] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{service?.name ?? "Lawn service"}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "Saved property"}{property?.city ? `, ${property.city}` : ""}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{job.completed_at ? `Completed ${formatDate(job.completed_at)}` : `Scheduled ${formatDate(job.scheduled_date)} ${job.scheduled_start_time ?? ""}`}</p>
                </div>
              );
            })}
            {jobRows.length ? null : <p className="rounded-2xl bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">No jobs yet. Request service and approved work will show here.</p>}
          </div>
        </Card>

        <div className="grid gap-3">
          <Card>
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold sm:text-xl">Recent requests</h2><Link href="/customer/requests" className="text-sm font-bold text-[var(--primary)]">View all</Link></div>
            <div className="mt-3 grid gap-2 text-sm">{requestRows.map((request) => { const property = one(request.properties); return <Link key={request.id} href={`/customer/requests/${request.id}`} className="grid gap-1 rounded-xl bg-[var(--muted)] p-3 hover:brightness-95"><div className="flex items-center justify-between gap-2"><strong>{serviceSummary(request)}</strong><StatusBadge status={request.status} /></div><span className="text-[var(--muted-foreground)]">{formatDate(request.created_at)} · {property?.address_line_1 ?? "Saved property"}</span></Link>; })}{requestRows.length ? null : <p className="text-[var(--muted-foreground)]">No requests yet.</p>}</div>
          </Card>
          <Card>
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold sm:text-xl">Estimates & invoices</h2><Link href="/customer/invoices" className="text-sm font-bold text-[var(--primary)]">Invoices</Link></div>
            <div className="mt-3 grid gap-2 text-sm">
              {estimateRows.slice(0, 2).map((estimate) => <Link key={estimate.id} href={`/customer/estimates/${estimate.id}`} className="grid gap-1 rounded-xl bg-[var(--muted)] p-3 hover:brightness-95"><div className="flex items-center justify-between gap-2"><strong>{estimate.document_number}</strong><StatusBadge status={estimate.status} /></div><span>{formatCurrency(Number(estimate.total))} · expires {formatDate(estimate.expiration_date)}</span></Link>)}
              {invoiceRows.slice(0, 2).map((invoice) => <Link key={invoice.id} href={`/customer/invoices/${invoice.id}`} className="grid gap-1 rounded-xl bg-[var(--muted)] p-3 hover:brightness-95"><div className="flex items-center justify-between gap-2"><strong>{invoice.document_number}</strong><StatusBadge status={invoice.status} /></div><span>Balance {formatCurrency(Number(invoice.balance_due))} · due {formatDate(invoice.due_date)}</span></Link>)}
              {estimateRows.length || invoiceRows.length ? null : <p className="text-[var(--muted-foreground)]">No estimates or invoices yet.</p>}
            </div>
          </Card>
          <Card className="grid gap-2">
            <h2 className="text-lg font-bold sm:text-xl">Saved account</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{properties?.length ?? 0} active propert{(properties?.length ?? 0) === 1 ? "y" : "ies"} saved. New service requests can reuse your existing account and property details.</p>
            <ButtonLink href="/request-quote" variant="outline">Request another service</ButtonLink>
          </Card>
        </div>
      </div>
    </div>
  );
}
