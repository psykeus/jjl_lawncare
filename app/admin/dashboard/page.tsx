import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

async function count(table: string, match?: Record<string, unknown>) {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (match) Object.entries(match).forEach(([key, value]) => { query = query.eq(key, value as never); });
  const { count: total } = await query;
  return total ?? 0;
}

export default async function AdminDashboardPage() {
  const [newRequests, sentEstimates, scheduledJobs, unpaidInvoices, expenses] = await Promise.all([
    count("quote_requests", { status: "new" }),
    count("documents", { document_type: "estimate", status: "sent" }),
    count("jobs", { status: "scheduled" }),
    count("documents", { document_type: "invoice", status: "unpaid" }),
    count("expenses"),
  ]);

  const cards = [
    ["New quote requests", newRequests, "Requests needing first review"],
    ["Estimates awaiting approval", sentEstimates, "Sent estimates not yet accepted"],
    ["Scheduled jobs", scheduledJobs, "Jobs currently scheduled"],
    ["Completed unpaid", unpaidInvoices, "Invoices still unpaid"],
    ["Expense records", expenses, "Logged business expenses"],
    ["Estimated revenue", formatCurrency(0), "Wire totals in reporting phase"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Admin dashboard</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Operational overview for requests, estimates, jobs, payments, and earnings.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([title, value, description]) => (
          <Card key={String(title)}>
            <CardHeader>
              <CardDescription>{description}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
            <div className="text-sm font-semibold">{title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
