import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
function stopQuery(property: { address_line_1: string | null; city: string | null; state: string | null; zip: string | null; latitude: number | string | null; longitude: number | string | null } | null) {
  if (!property) return "";
  if (property.latitude && property.longitude) return `${property.latitude},${property.longitude}`;
  return [property.address_line_1, property.city, property.state, property.zip].filter(Boolean).join(", ");
}

export default async function CrewMapPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date, customers(name), properties(address_line_1, city, state, zip, latitude, longitude)")
    .in("status", ["accepted", "scheduled", "on_the_way", "in_progress", "completed_unpaid"])
    .order("scheduled_date", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const todaysStops = (jobs ?? []).filter((job) => job.scheduled_date === today).map((job) => stopQuery(one(job.properties))).filter(Boolean).slice(0, 10);
  const routeHref = todaysStops.length > 1
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(todaysStops[0])}&destination=${encodeURIComponent(todaysStops[todaysStops.length - 1])}${todaysStops.length > 2 ? `&waypoints=${encodeURIComponent(todaysStops.slice(1, -1).join("|"))}` : ""}`
    : todaysStops[0] ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(todaysStops[0])}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Crew map</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Assigned job locations and directions.</p>
        </div>
        {routeHref ? <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-[var(--primary-foreground)]" href={routeHref} target="_blank" rel="noreferrer">Open today route</a> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(jobs ?? []).map((job) => {
          const customer = one(job.customers);
          const property = one(job.properties);
          const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stopQuery(property))}`;
          return (
            <Card key={job.id}>
              <div className="flex items-start justify-between gap-3"><h2 className="font-bold"><Link href={`/crew/jobs/${job.id}`}>{customer?.name ?? "Job"}</Link></h2><StatusBadge status={job.status} /></div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">{property?.address_line_1}<br />{property?.city}, {property?.state} {property?.zip}</p>
              <p className="mt-2 text-sm">Scheduled: {formatDate(job.scheduled_date)}</p>
              <a className="mt-4 inline-block text-sm font-semibold text-[var(--primary)]" href={mapsHref} target="_blank" rel="noreferrer">Open directions</a>
            </Card>
          );
        })}
        {jobs?.length ? null : <Card>No assigned jobs to map.</Card>}
      </div>
    </div>
  );
}
