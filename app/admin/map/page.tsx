import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function AdminMapPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date, customers(name), properties(address_line_1, city, state, zip, latitude, longitude)")
    .neq("status", "cancelled")
    .order("scheduled_date", { ascending: true });

  const locatedJobs = (jobs ?? []).filter((job) => {
    const property = one(job.properties);
    return property?.latitude && property?.longitude;
  });
  const mapQuery = locatedJobs.map((job) => {
    const property = one(job.properties);
    return `${property?.latitude},${property?.longitude}`;
  }).join("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Internal map</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Authorized job locations only. Public users never see customer addresses or map markers.</p>
      </div>
      <Card>
        <h2 className="text-xl font-bold">Google Maps</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Open individual job locations in Google Maps. Full embedded markers can be added once the Google Maps browser key is configured.</p>
        {mapQuery ? <a className="mt-4 inline-block font-semibold text-[var(--primary)]" href={`https://www.google.com/maps/dir/${mapQuery}`} target="_blank" rel="noreferrer">Open route-style map</a> : null}
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(jobs ?? []).map((job) => {
          const customer = one(job.customers);
          const property = one(job.properties);
          const mapsHref = property?.latitude && property?.longitude
            ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property?.address_line_1}, ${property?.city}, ${property?.state} ${property?.zip}`)}`;
          return (
            <Card key={job.id}>
              <div className="flex items-start justify-between gap-3"><h2 className="font-bold"><Link href={`/admin/jobs/${job.id}`}>{customer?.name ?? "Job"}</Link></h2><StatusBadge status={job.status} /></div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">{property?.address_line_1}<br />{property?.city}, {property?.state} {property?.zip}</p>
              <p className="mt-2 text-sm">Scheduled: {formatDate(job.scheduled_date)}</p>
              <a className="mt-4 inline-block text-sm font-semibold text-[var(--primary)]" href={mapsHref} target="_blank" rel="noreferrer">Open in Google Maps</a>
            </Card>
          );
        })}
        {jobs?.length ? null : <Card>No jobs to map yet.</Card>}
      </div>
    </div>
  );
}
