import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function CrewDashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: jobs }, { data: completed }, { data: expenses }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status, scheduled_date, scheduled_start_time, estimated_duration_minutes, customers(name), properties(address_line_1, city)")
      .in("status", ["accepted", "scheduled", "on_the_way", "in_progress", "completed_unpaid"])
      .order("scheduled_date", { ascending: true })
      .limit(8),
    supabase
      .from("jobs")
      .select("id, status, invoice:documents!jobs_invoice_id_fkey(total, amount_paid)")
      .in("status", ["completed", "completed_unpaid", "paid"]),
    supabase
      .from("expenses")
      .select("id, amount, reimbursed"),
  ]);

  const todayJobs = (jobs ?? []).filter((job) => job.scheduled_date === today);
  const openJobs = (jobs ?? []).filter((job) => job.status !== "completed_unpaid");
  const paidRevenue = (completed ?? []).reduce((sum, job) => {
    const invoice = one(job.invoice);
    return sum + Number(invoice?.amount_paid ?? 0);
  }, 0);
  const unreimbursedExpenses = (expenses ?? []).filter((expense) => !expense.reimbursed).reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const roughCrewShare = Math.max(0, (paidRevenue - unreimbursedExpenses) / 3);
  const rows = jobs ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Field work"
        title="Crew dashboard"
        description="Quick access to assigned jobs, map, checklists, photos, and estimated earnings."
        actions={<ButtonLink href="/crew/map">Open map</ButtonLink>}
      />

      <StatGrid>
        <StatCard label="Today" value={todayJobs.length} hint="Jobs scheduled today" href="/crew/jobs" />
        <StatCard label="Open jobs" value={openJobs.length} hint="Assigned active work" href="/crew/jobs" />
        <StatCard label="Paid revenue" value={formatCurrency(paidRevenue)} hint="Paid completed work" href="/crew/earnings" />
        <StatCard label="Rough share" value={formatCurrency(roughCrewShare)} hint="Estimated crew split" href="/crew/earnings" />
      </StatGrid>

      {rows.length ? (
        <div className="grid gap-3 md:hidden">
          {rows.map((job) => {
            const customer = one(job.customers);
            const property = one(job.properties);
            return (
              <Card key={job.id} className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3"><Link href={`/crew/jobs/${job.id}`} className="font-black text-[var(--primary)]">{customer?.name ?? "Job"}</Link><StatusBadge status={job.status} /></div>
                <p className="text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "No address"}{property?.city ? `, ${property.city}` : ""}</p>
                <div className="flex items-center justify-between gap-3 text-sm"><span>{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</span><span>{job.estimated_duration_minutes ?? 60} min</span></div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="md:hidden"><EmptyState title="No assigned open jobs" description="Assigned work will appear here when it is scheduled." /></div>
      )}

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Job</th><th className="p-3">Address</th><th className="p-3">Scheduled</th><th className="p-3">Duration</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {rows.map((job) => {
              const customer = one(job.customers);
              const property = one(job.properties);
              return <tr key={job.id} className="border-t border-[var(--border)] align-top hover:bg-[var(--muted)]"><td className="p-3 font-semibold"><Link href={`/crew/jobs/${job.id}`}>{customer?.name ?? "Job"}</Link></td><td className="p-3">{property?.address_line_1}, {property?.city}</td><td className="p-3 whitespace-nowrap">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</td><td className="p-3 whitespace-nowrap">{job.estimated_duration_minutes ?? 60} min</td><td className="p-3 whitespace-nowrap"><StatusBadge status={job.status} /></td></tr>;
            })}
            {rows.length ? null : <tr><td colSpan={5} className="p-3 text-[var(--muted-foreground)]">No assigned open jobs.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
