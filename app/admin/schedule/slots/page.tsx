import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { buildRouteTimeline, findCapacityWarnings, minutesToTime, type CrewAvailability, type PlannerJob } from "@/lib/schedule/planner";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
function isoDate(offsetDays: number) { const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString().slice(0, 10); }
function timeToInput(total: number) { const hours = Math.floor(total / 60); const minutes = total % 60; return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`; }

export default async function SlotFinderPage({ searchParams }: { searchParams: Promise<{ duration?: string; crew?: string; days?: string }> }) {
  const params = await searchParams;
  const duration = Math.max(15, Number(params.duration ?? 60));
  const crewNeeded = Math.max(1, Number(params.crew ?? 1));
  const days = Math.min(30, Math.max(1, Number(params.days ?? 14)));
  const start = isoDate(0);
  const end = isoDate(days - 1);
  const supabase = await createClient();
  const [{ data: jobs }, { data: availability }] = await Promise.all([
    supabase.from("jobs").select("id, status, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_duration_minutes, required_crew_size, earliest_start_time, latest_end_time, route_priority, customers(name), properties(address_line_1, city, latitude, longitude)").gte("scheduled_date", start).lte("scheduled_date", end).neq("status", "cancelled"),
    supabase.from("crew_availability").select("id, available_date, start_time, end_time, max_hours, profiles(name, email)").gte("available_date", start).lte("available_date", end).eq("active", true),
  ]);

  const rows = Array.from({ length: days }, (_, index) => isoDate(index)).map((date) => {
    const plannerJobs: PlannerJob[] = (jobs ?? []).filter((job) => job.scheduled_date === date).map((job) => {
      const customer = one(job.customers);
      const property = one(job.properties);
      return { id: job.id, customerName: customer?.name ?? "Unknown", address: property?.address_line_1 ?? "", city: property?.city ?? "", status: job.status, scheduledDate: job.scheduled_date, scheduledStartTime: job.scheduled_start_time, scheduledEndTime: job.scheduled_end_time, estimatedDurationMinutes: job.estimated_duration_minutes, requiredCrewSize: job.required_crew_size, earliestStartTime: job.earliest_start_time, latestEndTime: job.latest_end_time, routePriority: job.route_priority, latitude: property?.latitude ? Number(property.latitude) : null, longitude: property?.longitude ? Number(property.longitude) : null };
    });
    const crewAvailability: CrewAvailability[] = (availability ?? []).filter((row) => row.available_date === date).map((row) => {
      const profile = one(row.profiles);
      return { id: row.id, crewName: profile?.name ?? profile?.email ?? "Crew", startTime: row.start_time, endTime: row.end_time, maxHours: row.max_hours ? Number(row.max_hours) : null };
    });
    const capacity = findCapacityWarnings(plannerJobs, crewAvailability);
    const addedWorkload = duration * crewNeeded + (plannerJobs.length ? 15 : 0);
    const timeline = buildRouteTimeline(plannerJobs, crewAvailability[0]?.startTime ? Number(crewAvailability[0].startTime.split(":")[0]) * 60 + Number(crewAvailability[0].startTime.split(":")[1]) : 9 * 60, crewAvailability);
    const suggestedStart = (timeline.at(-1)?.end ?? (crewAvailability[0]?.startTime ? Number(crewAvailability[0].startTime.split(":")[0]) * 60 + Number(crewAvailability[0].startTime.split(":")[1]) : 9 * 60)) + (plannerJobs.length ? 15 : 0);
    return { date, plannerJobs, crewAvailability, capacity, addedWorkload, suggestedStart, fits: capacity.remaining >= addedWorkload && crewAvailability.length >= crewNeeded };
  });

  const best = rows.filter((row) => row.fits).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/admin/schedule" className="text-[var(--primary)]">← Schedule</Link>}
        title="Available slot finder"
        description="Find candidate days for a new job using duration, required crew, existing workload, travel buffer, and entered crew availability."
      />
      <Card>
        <form className="grid gap-3 md:grid-cols-[140px_120px_120px_auto]">
          <Field label="Minutes"><Input name="duration" type="number" min="15" defaultValue={duration} /></Field>
          <Field label="Crew"><Input name="crew" type="number" min="1" defaultValue={crewNeeded} /></Field>
          <Field label="Days"><Input name="days" type="number" min="1" max="30" defaultValue={days} /></Field>
          <Button className="self-end" type="submit">Find slots</Button>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Best candidate slots</h2>
        <div className="mt-4 grid gap-3">
          {best.map((row) => <Link key={row.date} href={`/admin/jobs/new?scheduledDate=${row.date}&scheduledStartTime=${timeToInput(row.suggestedStart)}&estimatedDurationMinutes=${duration}&requiredCrewSize=${crewNeeded}`} className="rounded-xl border border-[color-mix(in_srgb,var(--success)_35%,var(--border))] tone-success p-4 text-sm text-[var(--success)]"><strong>{formatDate(row.date)} around {minutesToTime(row.suggestedStart)}</strong><br />Use this slot for a new job · Remaining after fit: {row.capacity.remaining - row.addedWorkload} crew-minutes · {row.crewAvailability.length} crew available</Link>)}
          {best.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No fitting slots found in this range. Add availability, reduce workload, or extend the search window.</p>}
        </div>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="min-w-[680px] w-full text-left text-sm"><thead className="bg-[var(--muted)]"><tr><th className="p-3">Date</th><th className="p-3">Jobs</th><th className="p-3">Crew</th><th className="p-3">Remaining</th><th className="p-3">Result</th></tr></thead><tbody>{rows.map((row) => <tr key={row.date} className="border-t border-[var(--border)]"><td className="p-3"><Link className="font-semibold text-[var(--primary)]" href={`/admin/schedule?date=${row.date}&duration=${duration}&crew=${crewNeeded}`}>{formatDate(row.date)}</Link></td><td className="p-3">{row.plannerJobs.length}</td><td className="p-3">{row.crewAvailability.length}</td><td className="p-3 whitespace-nowrap">{row.capacity.remaining} min</td><td className={`p-3 font-semibold ${row.fits ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{row.fits ? `Fits around ${minutesToTime(row.suggestedStart)}` : "Full / unavailable"}</td></tr>)}</tbody></table>
      </Card>
    </div>
  );
}
