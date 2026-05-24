import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date, scheduled_start_time, assigned_crew_ids, customers(name), properties(address_line_1, city), documents!jobs_estimate_id_fkey(document_number, total)")
    .order("created_at", { ascending: false });

  const rows = jobs ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Jobs"
        description="Schedule accepted work, assign crew, track field completion, and generate invoices."
        actions={<ButtonLink href="/admin/jobs/new">Create job</ButtonLink>}
      />

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
