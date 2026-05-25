import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createExpense } from "./actions";

const categories = ["Gas", "Trimmer string", "Trash bags", "Gloves", "Tools", "Mower maintenance", "Oil", "Repairs", "Drinks/water", "Transportation", "Materials", "Other"];

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: expenses }, { data: jobs }] = await Promise.all([
    supabase.from("expenses").select("*, profiles(name), jobs(id, customers(name), properties(address_line_1))").order("expense_date", { ascending: false }),
    supabase.from("jobs").select("id, customers(name), properties(address_line_1)").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Expenses</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Track gas, supplies, maintenance, materials, and reimbursements.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Expense saved.</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-xl font-bold">Add expense</h2>
          <form action={createExpense} className="mt-4 grid gap-4">
            <Field label="Category"><Select name="category" required>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></Field>
            <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
            <Field label="Date"><Input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="Related job">
              <Select name="jobId"><option value="">General business expense</option>{(jobs ?? []).map((job) => { const customer = one(job.customers); const property = one(job.properties); return <option key={job.id} value={job.id}>{customer?.name ?? "Job"} — {property?.address_line_1 ?? "address"}</option>; })}</Select>
            </Field>
            <label className="text-sm"><input className="mr-2" type="checkbox" name="reimbursed" /> Reimbursed</label>
            <Field label="Notes"><Textarea name="notes" /></Field>
            <Field label="Receipt image/PDF"><Input name="receipt" type="file" accept="image/*,application/pdf" /></Field>
            <Button type="submit">Save expense</Button>
          </form>
        </Card>

        <div className="grid gap-3 md:hidden">
          {(expenses ?? []).map((expense) => { const paidBy = one(expense.profiles); const job = one(expense.jobs); const customer = one(job?.customers ?? null); return (
            <Card key={expense.id} className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-black">{expense.category}</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{formatDate(expense.expense_date)} · {customer?.name ?? "General"}</p></div><strong>{formatCurrency(Number(expense.amount))}</strong></div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm"><div><span className="block text-[var(--muted-foreground)]">Paid by</span><strong>{paidBy?.name ?? "—"}</strong></div><div><span className="block text-[var(--muted-foreground)]">Reimbursed</span><strong>{expense.reimbursed ? "Yes" : "No"}</strong></div></div>
            </Card>
          ); })}
          {expenses?.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No expenses recorded.</p></Card>}
        </div>

        <Card className="hidden overflow-x-auto p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]"><tr><th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3">Paid by</th><th className="p-3">Job</th><th className="p-3">Reimbursed</th></tr></thead>
            <tbody>
              {(expenses ?? []).map((expense) => { const paidBy = one(expense.profiles); const job = one(expense.jobs); const customer = one(job?.customers ?? null); return <tr key={expense.id} className="border-t border-[var(--border)]"><td className="p-3">{formatDate(expense.expense_date)}</td><td className="p-3">{expense.category}</td><td className="p-3 font-semibold">{formatCurrency(Number(expense.amount))}</td><td className="p-3">{paidBy?.name ?? "—"}</td><td className="p-3">{customer?.name ?? "General"}</td><td className="p-3">{expense.reimbursed ? "Yes" : "No"}</td></tr>; })}
              {expenses?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No expenses recorded.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
