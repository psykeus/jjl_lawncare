import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function CrewEarningsPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: expenses }, { data: settings }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status, completed_at, scheduled_date, assigned_crew_ids, customers(name), invoice:documents!jobs_invoice_id_fkey(total, amount_paid, balance_due, status)")
      .in("status", ["completed", "completed_unpaid", "paid"])
      .order("completed_at", { ascending: false }),
    supabase.from("expenses").select("id, job_id, amount, reimbursed"),
    supabase.from("settings").select("value_json").eq("key", "tax_reserve").maybeSingle(),
  ]);

  const reserve = settings?.value_json as { equipmentReservePercent?: number; taxSavingsReservePercent?: number } | null;
  const reserveRate = (Number(reserve?.equipmentReservePercent ?? 0) + Number(reserve?.taxSavingsReservePercent ?? 0)) / 100;
  const expenseByJob = new Map<string, number>();
  for (const expense of expenses ?? []) {
    if (!expense.job_id || expense.reimbursed) continue;
    expenseByJob.set(expense.job_id, (expenseByJob.get(expense.job_id) ?? 0) + Number(expense.amount ?? 0));
  }

  const rows = (jobs ?? []).map((job) => {
    const invoice = one(job.invoice);
    const paid = Number(invoice?.amount_paid ?? 0);
    const jobExpenses = expenseByJob.get(job.id) ?? 0;
    const reserves = Math.max(0, paid * reserveRate);
    const distributable = Math.max(0, paid - jobExpenses - reserves);
    const crewCount = Math.max(1, (job.assigned_crew_ids ?? []).length || 3);
    return { job, invoice, paid, jobExpenses, reserves, distributable, crewCount, share: distributable / crewCount };
  });

  const totals = rows.reduce((sum, row) => ({
    paid: sum.paid + row.paid,
    expenses: sum.expenses + row.jobExpenses,
    reserves: sum.reserves + row.reserves,
    distributable: sum.distributable + row.distributable,
    share: sum.share + row.share,
  }), { paid: 0, expenses: 0, reserves: 0, distributable: 0, share: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">My earnings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Estimated crew payout share after unreimbursed job expenses and reserve percentages. Final payouts are admin-confirmed.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-[var(--muted-foreground)]">Paid revenue</div><div className="mt-2 text-3xl font-black">{formatCurrency(totals.paid)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Expenses</div><div className="mt-2 text-3xl font-black">{formatCurrency(totals.expenses)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Reserves</div><div className="mt-2 text-3xl font-black">{formatCurrency(totals.reserves)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Estimated share</div><div className="mt-2 text-3xl font-black">{formatCurrency(totals.share)}</div></Card>
      </div>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => {
          const customer = one(row.job.customers);
          return (
            <Card key={row.job.id} className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><Link href={`/crew/jobs/${row.job.id}`} className="font-bold">{customer?.name ?? "Job"}</Link><p className="text-xs text-[var(--muted-foreground)]">{formatDate(row.job.completed_at ?? row.job.scheduled_date)}</p></div>
                <StatusBadge status={row.job.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm">
                <div><span className="block text-[var(--muted-foreground)]">Paid</span><strong>{formatCurrency(row.paid)}</strong></div>
                <div><span className="block text-[var(--muted-foreground)]">My share</span><strong>{formatCurrency(row.share)}</strong></div>
                <div><span className="block text-[var(--muted-foreground)]">Expenses</span><strong>{formatCurrency(row.jobExpenses)}</strong></div>
                <div><span className="block text-[var(--muted-foreground)]">Reserves</span><strong>{formatCurrency(row.reserves)}</strong></div>
              </div>
            </Card>
          );
        })}
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No completed assigned jobs yet.</p></Card>}
      </div>

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Job</th><th className="p-3">Paid</th><th className="p-3">Expenses</th><th className="p-3">Reserves</th><th className="p-3">Crew split</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const customer = one(row.job.customers);
              return <tr key={row.job.id} className="border-t border-[var(--border)]"><td className="p-3 font-semibold"><Link href={`/crew/jobs/${row.job.id}`}>{customer?.name ?? "Job"}</Link><div className="text-xs font-normal text-[var(--muted-foreground)]">{formatDate(row.job.completed_at ?? row.job.scheduled_date)}</div></td><td className="p-3">{formatCurrency(row.paid)}</td><td className="p-3">{formatCurrency(row.jobExpenses)}</td><td className="p-3">{formatCurrency(row.reserves)}</td><td className="p-3">{formatCurrency(row.share)} / {row.crewCount}</td><td className="p-3"><StatusBadge status={row.job.status} /></td></tr>;
            })}
            {rows.length ? null : <tr><td colSpan={6} className="p-3 text-[var(--muted-foreground)]">No completed assigned jobs yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
