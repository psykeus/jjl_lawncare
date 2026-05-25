import { Card } from "@/components/ui/card";
import { calculateEarningsSplit } from "@/lib/earnings/calculations";
import { defaultTaxReserveSettings, mergeSettings } from "@/lib/settings/defaults";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function EarningsPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: expenses }, { data: profiles }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status, assigned_crew_ids, customers(name), invoice:documents!jobs_invoice_id_fkey(total, status, amount_paid)")
      .in("status", ["completed", "completed_unpaid", "paid"])
      .order("created_at", { ascending: false }),
    supabase.from("expenses").select("job_id, amount"),
    supabase.from("profiles").select("id, name, role"),
    supabase.from("settings").select("value_json").eq("key", "tax_reserve").maybeSingle(),
  ]);

  const taxReserve = mergeSettings(defaultTaxReserveSettings, settingsRow?.value_json);
  const expenseByJob = new Map<string, number>();
  for (const expense of expenses ?? []) {
    if (!expense.job_id) continue;
    expenseByJob.set(expense.job_id, (expenseByJob.get(expense.job_id) ?? 0) + Number(expense.amount));
  }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile.name ?? "Crew"]));

  const rows = (jobs ?? []).map((job) => {
    const invoice = one(job.invoice);
    const customer = one(job.customers);
    const grossRevenue = Number(invoice?.amount_paid ?? invoice?.total ?? 0);
    const crewMemberIds = ((job.assigned_crew_ids ?? []) as string[]);
    const split = calculateEarningsSplit({
      grossRevenue,
      jobExpenses: expenseByJob.get(job.id) ?? 0,
      equipmentReservePercent: taxReserve.equipmentReservePercent,
      taxSavingsReservePercent: taxReserve.taxSavingsReservePercent,
      crewMemberIds,
    });
    return { job, invoice, customer, split };
  });

  const totals = rows.reduce((sum, row) => ({
    grossRevenue: sum.grossRevenue + row.split.grossRevenue,
    expenses: sum.expenses + row.split.jobExpenses,
    equipmentReserve: sum.equipmentReserve + row.split.equipmentReserve,
    taxSavingsReserve: sum.taxSavingsReserve + row.split.taxSavingsReserve,
    distributableProfit: sum.distributableProfit + row.split.distributableProfit,
  }), { grossRevenue: 0, expenses: 0, equipmentReserve: 0, taxSavingsReserve: 0, distributableProfit: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Earnings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Job profitability and estimated crew payouts after expenses and reserves.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><div className="text-sm text-[var(--muted-foreground)]">Gross</div><div className="mt-2 text-2xl font-black">{formatCurrency(totals.grossRevenue)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Expenses</div><div className="mt-2 text-2xl font-black">{formatCurrency(totals.expenses)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Equipment reserve</div><div className="mt-2 text-2xl font-black">{formatCurrency(totals.equipmentReserve)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Tax/savings</div><div className="mt-2 text-2xl font-black">{formatCurrency(totals.taxSavingsReserve)}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Distributable</div><div className="mt-2 text-2xl font-black">{formatCurrency(totals.distributableProfit)}</div></Card>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <Card key={row.job.id} className="grid gap-3 p-4">
            <div className="flex items-start justify-between gap-3"><h2 className="font-black">{row.customer?.name ?? "Job"}</h2><strong>{formatCurrency(row.split.distributableProfit)}</strong></div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm">
              <div><span className="block text-[var(--muted-foreground)]">Gross</span><strong>{formatCurrency(row.split.grossRevenue)}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Expenses</span><strong>{formatCurrency(row.split.jobExpenses)}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Reserves</span><strong>{formatCurrency(row.split.equipmentReserve + row.split.taxSavingsReserve)}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Payouts</span><strong>{row.split.payouts.length}</strong></div>
            </div>
            <div className="text-sm">{row.split.payouts.length ? row.split.payouts.map((payout) => <div key={payout.crewMemberId}>{profileById.get(payout.crewMemberId) ?? "Crew"}: {formatCurrency(payout.amount)}</div>) : <span className="text-[var(--muted-foreground)]">No crew assigned</span>}</div>
          </Card>
        ))}
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No completed or paid jobs yet.</p></Card>}
      </div>

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Job</th><th className="p-3">Gross</th><th className="p-3">Expenses</th><th className="p-3">Reserves</th><th className="p-3">Distributable</th><th className="p-3">Crew payout</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.job.id} className="border-t border-[var(--border)] align-top">
                <td className="p-3 font-semibold">{row.customer?.name ?? "Job"}</td>
                <td className="p-3">{formatCurrency(row.split.grossRevenue)}</td>
                <td className="p-3">{formatCurrency(row.split.jobExpenses)}</td>
                <td className="p-3">{formatCurrency(row.split.equipmentReserve + row.split.taxSavingsReserve)}</td>
                <td className="p-3 font-semibold">{formatCurrency(row.split.distributableProfit)}</td>
                <td className="p-3">
                  {row.split.payouts.length ? row.split.payouts.map((payout) => <div key={payout.crewMemberId}>{profileById.get(payout.crewMemberId) ?? "Crew"}: {formatCurrency(payout.amount)}</div>) : <span className="text-[var(--muted-foreground)]">No crew assigned</span>}
                </td>
              </tr>
            ))}
            {rows.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No completed or paid jobs yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
