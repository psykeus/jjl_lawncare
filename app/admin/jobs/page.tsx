import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const query = (params.q ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date, scheduled_start_time, assigned_crew_ids, customers(name), properties(address_line_1, city), documents!jobs_estimate_id_fkey(document_number, total)")
    .order("created_at", { ascending: false });

  const allRows = jobs ?? [];
  const rows = allRows.filter((job) => {
    const customer = one(job.customers);
    const property = one(job.properties);
    const estimate = one(job.documents);
    const matchesStatus = status === "all" || job.status === status;
    const matchesQuery = !query || [customer?.name, property?.address_line_1, property?.city, estimate?.document_number].some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Jobs"
        description="Schedule accepted work, assign crew, track field completion, and generate invoices."
        actions={<ButtonLink href="/admin/jobs/new">Create job</ButtonLink>}
      />

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <label className="grid gap-1 text-sm font-semibold">Status<Select name="status" defaultValue={status}><option value="all">All statuses</option><option value="accepted">Accepted</option><option value="scheduled">Scheduled</option><option value="on_the_way">On the way</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></Select></label>
          <label className="grid gap-1 text-sm font-semibold">Search<Input name="q" defaultValue={params.q ?? ""} placeholder="Customer, address, estimate" /></label>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Showing {rows.length} of {allRows.length} jobs.</p>
      </Card>

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((job) => {
              const customer = one(job.customers);
              const property = one(job.properties);
              const estimate = one(job.documents);
              return (
                <Card key={job.id} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/jobs/${job.id}`} className="font-black text-[var(--primary)]">{customer?.name ?? "Unknown"}</Link>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "No address"}{property?.city ? `, ${property.city}` : ""}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Scheduled</dt><dd>{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</dd></div>
                    <div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Crew</dt><dd>{job.assigned_crew_ids?.length ?? 0}</dd></div>
                    <div className="col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Estimate</dt><dd>{estimate?.document_number ?? "—"}</dd></div>
                  </dl>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Estimate</th><th className="p-3">Scheduled</th><th className="p-3">Crew</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {rows.map((job) => {
                  const customer = one(job.customers);
                  const property = one(job.properties);
                  const estimate = one(job.documents);
                  return (
                    <tr key={job.id} className="border-t border-[var(--border)] align-top hover:bg-[var(--muted)]">
                      <td className="p-3 font-semibold"><Link href={`/admin/jobs/${job.id}`}>{customer?.name ?? "Unknown"}</Link></td>
                      <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                      <td className="p-3 whitespace-nowrap">{estimate?.document_number ?? "—"}</td>
                      <td className="p-3 whitespace-nowrap">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</td>
                      <td className="p-3 whitespace-nowrap">{job.assigned_crew_ids?.length ?? 0}</td>
                      <td className="p-3 whitespace-nowrap"><StatusBadge status={job.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No jobs yet" description="Accept an estimate, then convert it to a job, or create a direct phone/text job." action={<ButtonLink href="/admin/jobs/new">Create job</ButtonLink>} />
      )}
    </div>
  );
}
