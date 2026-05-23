import Link from "next/link";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Jobs</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Schedule accepted work, assign crew, and track completion.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Estimate</th><th className="p-3">Scheduled</th><th className="p-3">Crew</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(jobs ?? []).map((job) => {
              const customer = one(job.customers);
              const property = one(job.properties);
              const estimate = one(job.documents);
              return (
                <tr key={job.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="p-3 font-semibold"><Link href={`/admin/jobs/${job.id}`}>{customer?.name ?? "Unknown"}</Link></td>
                  <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                  <td className="p-3">{estimate?.document_number ?? "—"}</td>
                  <td className="p-3">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</td>
                  <td className="p-3">{job.assigned_crew_ids?.length ?? 0}</td>
                  <td className="p-3"><StatusBadge status={job.status} /></td>
                </tr>
              );
            })}
            {jobs?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No jobs yet. Accept an estimate, then convert it to a job.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
