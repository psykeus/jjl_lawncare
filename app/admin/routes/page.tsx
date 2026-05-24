import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { estimateDrivingLegs } from "@/lib/maps/distance-matrix";
import { buildRouteTimeline, findCapacityWarnings, minutesToTime, sortJobsForRoute, type CrewAvailability, type PlannerJob } from "@/lib/schedule/planner";

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
function today() { return new Date().toISOString().slice(0, 10); }

export default async function AdminRoutesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = params.date ?? today();
  const supabase = await createClient();
  const [{ data: jobs }, { data: availability }] = await Promise.all([
    supabase.from("jobs").select("id, status, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_duration_minutes, required_crew_size, earliest_start_time, latest_end_time, route_priority, customers(name), properties(address_line_1, city, latitude, longitude)").eq("scheduled_date", date).in("status", ["accepted", "scheduled", "on_hold", "on_the_way", "in_progress"]).order("route_priority", { ascending: false }),
    supabase.from("crew_availability").select("id, start_time, end_time, max_hours, profiles(name, email)").eq("available_date", date).eq("active", true),
  ]);
  const plannerJobs: PlannerJob[] = (jobs ?? []).map((job) => {
    const customer = one(job.customers);
    const property = one(job.properties);
    return { id: job.id, customerName: customer?.name ?? "Unknown customer", address: property?.address_line_1 ?? "No address", city: property?.city ?? "", status: job.status, scheduledDate: job.scheduled_date, scheduledStartTime: job.scheduled_start_time, scheduledEndTime: job.scheduled_end_time, estimatedDurationMinutes: job.estimated_duration_minutes, requiredCrewSize: job.required_crew_size, earliestStartTime: job.earliest_start_time, latestEndTime: job.latest_end_time, routePriority: job.route_priority, latitude: property?.latitude ? Number(property.latitude) : null, longitude: property?.longitude ? Number(property.longitude) : null };
  });
  const crewAvailability: CrewAvailability[] = (availability ?? []).map((row) => {
    const profile = one(row.profiles);
    return { id: row.id, crewName: profile?.name ?? profile?.email ?? "Crew", startTime: row.start_time, endTime: row.end_time, maxHours: row.max_hours ? Number(row.max_hours) : null };
  });
  const dayStart = crewAvailability.map((row) => row.startTime).sort()[0];
  const startMinutes = dayStart ? Number(dayStart.split(":")[0]) * 60 + Number(dayStart.split(":")[1]) : 9 * 60;
  const orderedJobs = sortJobsForRoute(plannerJobs);
  const legEstimate = await estimateDrivingLegs(orderedJobs);
  const legMinutes = legEstimate.legs.map((leg) => leg.durationMinutes);
  const timeline = buildRouteTimeline(orderedJobs, startMinutes, crewAvailability, legMinutes);
  const capacity = findCapacityWarnings(orderedJobs, crewAvailability, legMinutes);
  const directionsUrl = orderedJobs.filter((job) => job.latitude && job.longitude).length > 1
    ? `https://www.google.com/maps/dir/${orderedJobs.map((job) => job.latitude && job.longitude ? `${job.latitude},${job.longitude}` : `${job.address}, ${job.city}`).map(encodeURIComponent).join("/")}`
    : "/admin/map";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Route planner"
        description="A deterministic route timeline using job priority, customer windows, estimated workload, and crew availability."
        actions={<form className="grid gap-2 sm:flex"><Input name="date" type="date" defaultValue={date} /><Button type="submit">Plan</Button></form>}
      />
      {legEstimate.error ? <Card className="border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] tone-warning text-sm text-[var(--warning)]">{legEstimate.error}</Card> : null}
      {capacity.warnings.length ? <Card className="border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] tone-danger"><h2 className="font-bold text-[var(--danger)]">Overbooking / routing warnings</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--danger)]">{capacity.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></Card> : <Card className="border-[color-mix(in_srgb,var(--success)_35%,var(--border))] tone-success text-sm text-[var(--success)]">This route fits the entered crew availability. Travel source: {legEstimate.source === "google" ? "Google Distance Matrix" : "15-minute fallback buffers"}.</Card>}
      <Card>
        <h2 className="text-xl font-bold">Planned timeline</h2>
        <div className="mt-4 grid gap-3">
          {timeline.map((entry, index) => {
            const leg = index > 0 ? legEstimate.legs[index - 1] : null;
            return <div key={entry.job.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-bold text-[var(--primary)]">Stop {index + 1}: {minutesToTime(entry.start)}–{minutesToTime(entry.end)}</div>{leg ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">Travel from prior stop: {leg.durationText ?? `${entry.travelBefore} min`}{leg.distanceText ? ` · ${leg.distanceText}` : ""}</p> : null}<h3 className="mt-1 font-bold"><Link href={`/admin/jobs/${entry.job.id}`}>{entry.job.customerName}</Link></h3><p className="text-sm text-[var(--muted-foreground)]">{entry.job.address}, {entry.job.city}</p></div><div className="text-right text-sm"><div>{entry.job.estimatedDurationMinutes ?? 60} min</div><div>{entry.job.requiredCrewSize ?? 1} crew needed</div><div>{entry.crewAvailable} crew available</div></div></div>{entry.warnings.length ? <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-[var(--danger)]">{entry.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}</div>;
          })}
          {timeline.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No routeable jobs for this day.</p>}
        </div>
      </Card>
      <Card><h2 className="text-xl font-bold">Slot guidance</h2><p className="mt-3 text-sm text-[var(--muted-foreground)]">Remaining capacity is {capacity.remaining} crew-minutes. If negative, the day is full or overbooked. For a new job, look for a day with enough remaining crew-minutes plus travel buffer.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/admin/schedule" className="text-sm font-semibold text-[var(--primary)]">Open schedule board</Link><a href={directionsUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--primary)]">Open route in Google Maps</a></div></Card>
    </div>
  );
}
