import Link from "next/link";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Crew dashboard</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Quick access to assigned jobs, map, checklists, photos, and estimated earnings.</p>
        </div>
        <Link href="/crew/map" className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white">Open map</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-[var(--muted-foreground)]">Today</div><div className="mt-2 text-3xl font-black">{todayJobs.length}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Open jobs</div><div className="mt-2 text-3xl font-black">{openJobs.length}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Paid revenue</div><div className="mt-2 text-3xl font-black">{formatCurrency(paidRevenue)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Rough share</div><div className="mt-2 text-3xl font-black">{formatCurrency(roughCrewShare)}</div></Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Job</th><th className="p-3">Address</th><th className="p-3">Scheduled</th><th className="p-3">Duration</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(jobs ?? []).map((job) => {
              const customer = one(job.customers);
              const property = one(job.properties);
              return <tr key={job.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]"><td className="p-3 font-semibold"><Link href={`/crew/jobs/${job.id}`}>{customer?.name ?? "Job"}</Link></td><td className="p-3">{property?.address_line_1}, {property?.city}</td><td className="p-3">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</td><td className="p-3">{job.estimated_duration_minutes ?? 60} min</td><td className="p-3"><StatusBadge status={job.status} /></td></tr>;
            })}
            {jobs?.length ? null : <tr><td colSpan={5} className="p-3 text-[var(--muted-foreground)]">No assigned open jobs.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
