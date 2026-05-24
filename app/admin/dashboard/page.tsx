import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

async function count(table: string, match?: Record<string, unknown>) {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (match) Object.entries(match).forEach(([key, value]) => { query = query.eq(key, value as never); });
  const { count: total } = await query;
  return total ?? 0;
}

type TaskLink = [string, string, string];

const operations: Array<{ title: string; description: string; links: TaskLink[] }> = [
  {
    title: "Intake and sales",
    description: "Turn public requests into estimates and accepted jobs.",
    links: [
      ["Review quote requests", "/admin/quote-requests", "Risk, photos, service answers, parent approval"],
      ["Build estimates", "/admin/estimates", "Draft/send estimate line items"],
      ["Manage customers", "/admin/customers", "Customer records, accounts, and properties"],
      ["Create phone/text job", "/admin/jobs/new", "Enter direct jobs without a public request"],
    ],
  },
  {
    title: "Scheduling and field operations",
    description: "Plan capacity, routes, crews, and daily execution.",
    links: [
      ["Schedule board", "/admin/schedule", "Capacity, workload, overbooking warnings"],
      ["Find open slots", "/admin/schedule/slots", "Multi-day available appointment windows"],
      ["Route planner", "/admin/routes", "Job ordering and travel-time estimates"],
      ["Admin map", "/admin/map", "Current, queue, and past job pins"],
      ["Crew availability", "/admin/crew/availability", "Who can work and how many hours"],
      ["Jobs", "/admin/jobs", "Schedule, assign, complete, and invoice jobs"],
    ],
  },
  {
    title: "Money and reporting",
    description: "Track invoices, payments, expenses, and earnings split.",
    links: [
      ["Invoices", "/admin/invoices", "Generate and monitor balances"],
      ["Payments", "/admin/payments", "Cash, Venmo, and manual payment records"],
      ["Expenses", "/admin/expenses", "Materials, fuel, and reimbursements"],
      ["Earnings", "/admin/earnings", "Revenue, reserves, and crew split"],
    ],
  },
  {
    title: "Platform administration",
    description: "Manage the app, catalog, access, and legal content.",
    links: [
      ["Users and access rights", "/admin/users", "Roles, banning, sign-in and activity analytics"],
      ["Service catalog", "/admin/services", "Pricing, homepage cards, questions, upsells"],
      ["Service areas", "/admin/service-areas", "Greater Cincinnati coverage rules"],
      ["Checklists", "/admin/checklists", "Crew-required completion steps"],
      ["Terms", "/admin/terms", "Quote and estimate acceptance terms"],
      ["Settings", "/admin/settings", "Business, payment, reserve, and public-site config"],
    ],
  },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [newRequests, reviewRequests, sentEstimates, scheduledJobs, unpaidInvoices, expenses, users, bannedUsers, crewUsers, recentRequests, recentJobs, invoices, payments] = await Promise.all([
    count("quote_requests", { status: "new" }),
    count("quote_requests", { status: "needs_review" }),
    count("documents", { document_type: "estimate", status: "sent" }),
    count("jobs", { status: "scheduled" }),
    count("documents", { document_type: "invoice", status: "unpaid" }),
    count("expenses"),
    count("profiles"),
    count("profiles", { active: false }),
    count("profiles", { role: "crew", active: true }),
    supabase.from("quote_requests").select("id, status, risk_level, created_at, customers(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("jobs").select("id, status, scheduled_date, customers(name)").order("scheduled_date", { ascending: true, nullsFirst: false }).limit(5),
    supabase.from("documents").select("document_type, status, total, balance_due"),
    supabase.from("payments").select("amount, status"),
  ]);

  const invoiceRows = invoices.data ?? [];
  const paymentRows = payments.data ?? [];
  const estimatePipeline = invoiceRows.filter((doc) => doc.document_type === "estimate" && ["draft", "sent", "viewed", "accepted"].includes(doc.status)).reduce((sum, doc) => sum + Number(doc.total ?? 0), 0);
  const invoiceBalance = invoiceRows.filter((doc) => doc.document_type === "invoice").reduce((sum, doc) => sum + Number(doc.balance_due ?? 0), 0);
  const collected = paymentRows.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const cards = [
    ["New quote requests", newRequests, "Requests needing first review"],
    ["Needs review", reviewRequests, "Requests flagged for admin/parent review"],
    ["Estimates awaiting approval", sentEstimates, "Sent estimates not yet accepted"],
    ["Scheduled jobs", scheduledJobs, "Jobs currently scheduled"],
    ["Unpaid invoices", unpaidInvoices, "Invoices still unpaid"],
    ["Expense records", expenses, "Logged business expenses"],
    ["Platform users", users, "Admin, crew, and customer login accounts"],
    ["Banned/inactive users", bannedUsers, "Profiles blocked from app access"],
    ["Active crew", crewUsers, "Crew users available for assignment"],
    ["Estimate pipeline", formatCurrency(estimatePipeline), "Draft/sent/viewed/accepted estimate total"],
    ["Open invoice balance", formatCurrency(invoiceBalance), "Outstanding invoice balance"],
    ["Collected payments", formatCurrency(collected), "Confirmed paid payment records"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command center"
        title="Admin dashboard"
        description="All admin work starts here: intake, services, scheduling, routes, money, users, access rights, and analytics."
        actions={
          <>
            <ButtonLink href="/admin/quote-requests">Review requests</ButtonLink>
            <ButtonLink href="/admin/users" variant="outline">Manage users</ButtonLink>
            <ButtonLink href="/admin/jobs/new" variant="outline">Enter job</ButtonLink>
          </>
        }
      />

      <StatGrid>
        {cards.map(([title, value, description]) => (
          <StatCard key={String(title)} label={title} value={value} hint={description} />
        ))}
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-2">
        {operations.map((group) => (
          <Card key={group.title}>
            <h2 className="text-xl font-bold">{group.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{group.description}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {group.links.map(([label, href, description]) => (
                <Link key={href} className="rounded-xl border border-[var(--border)] p-4 hover:bg-[var(--muted)]" href={href}>
                  <div className="font-semibold">{label}</div>
                  <div className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</div>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Recent requests</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {(recentRequests.data ?? []).map((request) => {
              const customer = Array.isArray(request.customers) ? request.customers[0] : request.customers;
              return <Link key={request.id} href={`/admin/quote-requests/${request.id}`} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--muted)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><span className="min-w-0 font-semibold">{customer?.name ?? "Unknown"}</span><span className="flex flex-wrap gap-2"><StatusBadge status={request.status} /><StatusBadge status={request.risk_level} /></span><span className="text-xs text-[var(--muted-foreground)]">{formatDate(request.created_at)}</span></Link>;
            })}
            {recentRequests.data?.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No recent requests.</p>}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Upcoming jobs</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {(recentJobs.data ?? []).map((job) => {
              const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers;
              return <Link key={job.id} href={`/admin/jobs/${job.id}`} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 hover:bg-[var(--muted)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><span className="min-w-0 font-semibold">{customer?.name ?? "Job"}</span><StatusBadge status={job.status} /><span className="text-xs text-[var(--muted-foreground)]">{formatDate(job.scheduled_date)}</span></Link>;
            })}
            {recentJobs.data?.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No upcoming jobs.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
