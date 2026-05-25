import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createExpense } from "./actions";

const categories = ["Gas", "Trimmer string", "Trash bags", "Gloves", "Tools", "Mower maintenance", "Oil", "Repairs", "Drinks/water", "Transportation", "Materials", "Other"];

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; q?: string; category?: string; reimbursed?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: expenses }, { data: jobs }] = await Promise.all([
    supabase.from("expenses").select("*, profiles(name), jobs(id, customers(name), properties(address_line_1))").order("expense_date", { ascending: false }),
    supabase.from("jobs").select("id, customers(name), properties(address_line_1)").order("created_at", { ascending: false }).limit(50),
  ]);

  const query = (params.q ?? "").trim().toLowerCase();
  const rows = (expenses ?? []).filter((expense) => {
    const paidBy = one(expense.profiles);
    const job = one(expense.jobs);
    const customer = one(job?.customers ?? null);
    const matchesCategory = !params.category || params.category === "all" || expense.category === params.category;
    const matchesReimbursed = !params.reimbursed || params.reimbursed === "all" || String(Boolean(expense.reimbursed)) === params.reimbursed;
    const matchesQuery = !query || [expense.category, expense.notes, paidBy?.name, customer?.name].some((value) => value?.toLowerCase().includes(query));
    return matchesCategory && matchesReimbursed && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Expenses</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Track gas, supplies, maintenance, materials, and reimbursements.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Expense saved.</div> : null}
      </div>

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[180px_160px_1fr_auto] md:items-end">
          <Field label="Category"><Select name="category" defaultValue={params.category ?? "all"}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></Field>
          <Field label="Reimbursed"><Select name="reimbursed" defaultValue={params.reimbursed ?? "all"}><option value="all">All</option><option value="true">Reimbursed</option><option value="false">Not reimbursed</option></Select></Field>
          <Field label="Search"><Input name="q" defaultValue={params.q ?? ""} placeholder="Category, notes, paid by, job" /></Field>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Showing {rows.length} of {(expenses ?? []).length} expenses.</p>
      </Card>

      <div className="grid gap-3 md:hidden">
        {rows.map((expense) => { const paidBy = one(expense.profiles); const job = one(expense.jobs); const customer = one(job?.customers ?? null); return (
          <Card key={expense.id} className="grid gap-3 p-4">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-black">{expense.category}</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{formatDate(expense.expense_date)} · {customer?.name ?? "General"}</p></div><strong>{formatCurrency(Number(expense.amount))}</strong></div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm"><div><span className="block text-[var(--muted-foreground)]">Paid by</span><strong>{paidBy?.name ?? "—"}</strong></div><div><span className="block text-[var(--muted-foreground)]">Reimbursed</span><strong>{expense.reimbursed ? "Yes" : "No"}</strong></div></div>
          </Card>
        ); })}
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No expenses match these filters.</p></Card>}
      </div>

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3">Paid by</th><th className="p-3">Job</th><th className="p-3">Reimbursed</th></tr></thead>
          <tbody>
            {rows.map((expense) => { const paidBy = one(expense.profiles); const job = one(expense.jobs); const customer = one(job?.customers ?? null); return <tr key={expense.id} className="border-t border-[var(--border)]"><td className="p-3">{formatDate(expense.expense_date)}</td><td className="p-3">{expense.category}</td><td className="p-3 font-semibold">{formatCurrency(Number(expense.amount))}</td><td className="p-3">{paidBy?.name ?? "—"}</td><td className="p-3">{customer?.name ?? "General"}</td><td className="p-3">{expense.reimbursed ? "Yes" : "No"}</td></tr>; })}
            {rows.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No expenses match these filters.</td></tr>}
          </tbody>
        </table>
      </Card>

      <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <summary className="cursor-pointer text-xl font-bold">Add expense</summary>
        <form action={createExpense} className="mt-4 grid gap-4">
          <Field label="Category"><Select name="category" required>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></Field>
          <Field label="Amount"><Input name="amount" type="number" step="0.01" min="0" required /></Field>
          <Field label="Date"><Input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label="Related job"><Select name="jobId"><option value="">General business expense</option>{(jobs ?? []).map((job) => { const customer = one(job.customers); const property = one(job.properties); return <option key={job.id} value={job.id}>{customer?.name ?? "Job"} — {property?.address_line_1 ?? "address"}</option>; })}</Select></Field>
          <label className="text-sm"><input className="mr-2" type="checkbox" name="reimbursed" /> Reimbursed</label>
          <Field label="Notes"><Textarea name="notes" /></Field>
          <Field label="Receipt image/PDF"><Input name="receipt" type="file" accept="image/*,application/pdf" /></Field>
          <Button type="submit">Save expense</Button>
        </form>
      </details>
    </div>
  );
}
