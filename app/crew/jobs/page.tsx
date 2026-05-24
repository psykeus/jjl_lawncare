import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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

  const rows = jobs ?? [];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Field work" title="My jobs" description="Assigned jobs, checklists, photos, and completion notes." />

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((job) => {
              const customer = one(job.customers);
              const property = one(job.properties);
              return (
                <Card key={job.id} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3"><Link href={`/crew/jobs/${job.id}`} className="font-black text-[var(--primary)]">{customer?.name ?? "Customer"}</Link><StatusBadge status={job.status} /></div>
                  <p className="text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "No address"}{property?.city ? `, ${property.city}` : ""}</p>
                  <p className="text-sm font-semibold">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</p>
                </Card>
              );
            })}
          </div>
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[680px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Scheduled</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {rows.map((job) => {
                  const customer = one(job.customers);
                  const property = one(job.properties);
                  return (
                    <tr key={job.id} className="border-t border-[var(--border)] align-top hover:bg-[var(--muted)]">
                      <td className="p-3 font-semibold"><Link href={`/crew/jobs/${job.id}`}>{customer?.name ?? "Customer"}</Link></td>
                      <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                      <td className="p-3 whitespace-nowrap">{formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</td>
                      <td className="p-3 whitespace-nowrap"><StatusBadge status={job.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No assigned jobs" description="Assigned jobs will appear here when they are scheduled." />
      )}
    </div>
  );
}
