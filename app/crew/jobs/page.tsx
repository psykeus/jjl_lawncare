import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function CrewJobsPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date, scheduled_start_time, customers(name), properties(address_line_1, city)")
    .order("scheduled_date", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">My jobs</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Assigned jobs, checklists, photos, and completion notes.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Scheduled</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {(jobs ?? []).map((job) => {
              const customer = one(job.customers);
              const property = one(job.properties);
              return (
                <tr key={job.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="p-3 font-semibold"><Link href={`/crew/jobs/${job.id}`}>{customer?.name ?? "Customer"}</Link></td>
                  <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                  <td className="p-3">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</td>
                  <td className="p-3"><StatusBadge status={job.status} /></td>
                </tr>
              );
            })}
            {jobs?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={4}>No assigned jobs.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
