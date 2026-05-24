import Link from "next/link";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { buildRouteTimeline, findCapacityWarnings, minutesToTime, type CrewAvailability, type PlannerJob } from "@/lib/schedule/planner";

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
function today() { return new Date().toISOString().slice(0, 10); }

export default async function AdminRoutesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date = params.date ?? today();
  const supabase = await createClient();
  const [{ data: jobs }, { data: availability }] = await Promise.all([
    supabase.from("jobs").select("id, status, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_duration_minutes, required_crew_size, earliest_start_time, latest_end_time, route_priority, customers(name), properties(address_line_1, city)").eq("scheduled_date", date).in("status", ["accepted", "scheduled", "on_hold", "on_the_way", "in_progress"]).order("route_priority", { ascending: false }),
    supabase.from("crew_availability").select("id, start_time, end_time, max_hours, profiles(name, email)").eq("available_date", date).eq("active", true),
  ]);
  const plannerJobs: PlannerJob[] = (jobs ?? []).map((job) => {
    const customer = one(job.customers);
    const property = one(job.properties);
    return { id: job.id, customerName: customer?.name ?? "Unknown customer", address: property?.address_line_1 ?? "No address", city: property?.city ?? "", status: job.status, scheduledDate: job.scheduled_date, scheduledStartTime: job.scheduled_start_time, scheduledEndTime: job.scheduled_end_time, estimatedDurationMinutes: job.estimated_duration_minutes, requiredCrewSize: job.required_crew_size, earliestStartTime: job.earliest_start_time, latestEndTime: job.latest_end_time, routePriority: job.route_priority };
  });
  const crewAvailability: CrewAvailability[] = (availability ?? []).map((row) => {
    const profile = one(row.profiles);
    return { id: row.id, crewName: profile?.name ?? profile?.email ?? "Crew", startTime: row.start_time, endTime: row.end_time, maxHours: row.max_hours ? Number(row.max_hours) : null };
  });
  const dayStart = crewAvailability.map((row) => row.startTime).sort()[0];
  const startMinutes = dayStart ? Number(dayStart.split(":")[0]) * 60 + Number(dayStart.split(":")[1]) : 9 * 60;
  const timeline = buildRouteTimeline(plannerJobs, startMinutes);
  const capacity = findCapacityWarnings(plannerJobs, crewAvailability);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-3xl font-black">Route planner</h1><p className="mt-2 text-[var(--muted-foreground)]">A deterministic route timeline using job priority, customer windows, estimated workload, and crew availability.</p></div>
        <form className="flex gap-2"><input className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm" name="date" type="date" defaultValue={date} /><button className="h-10 rounded-lg bg-[var(--primary)] px-4 font-semibold text-white">Plan</button></form>
      </div>
      {capacity.warnings.length ? <Card className="border-red-200 bg-red-50"><h2 className="font-bold text-[var(--danger)]">Overbooking / routing warnings</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">{capacity.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></Card> : <Card className="border-green-200 bg-green-50 text-sm text-green-800">This route fits the entered crew availability.</Card>}
      <Card>
        <h2 className="text-xl font-bold">Planned timeline</h2>
        <div className="mt-4 grid gap-3">
          {timeline.map((entry, index) => <div key={entry.job.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-bold text-[var(--primary)]">Stop {index + 1}: {minutesToTime(entry.start)}–{minutesToTime(entry.end)}</div><h3 className="mt-1 font-bold"><Link href={`/admin/jobs/${entry.job.id}`}>{entry.job.customerName}</Link></h3><p className="text-sm text-[var(--muted-foreground)]">{entry.job.address}, {entry.job.city}</p></div><div className="text-right text-sm"><div>{entry.job.estimatedDurationMinutes ?? 60} min</div><div>{entry.job.requiredCrewSize ?? 1} crew</div></div></div>{entry.warning ? <p className="mt-2 text-sm font-semibold text-[var(--danger)]">{entry.warning}</p> : null}</div>)}
          {timeline.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No routeable jobs for this day.</p>}
        </div>
      </Card>
      <Card><h2 className="text-xl font-bold">Slot guidance</h2><p className="mt-3 text-sm text-[var(--muted-foreground)]">Remaining capacity is {capacity.remaining} crew-minutes. If negative, the day is full or overbooked. For a new job, look for a day with enough remaining crew-minutes plus a 15-minute travel buffer.</p><Link href="/admin/schedule" className="mt-4 inline-block text-sm font-semibold text-[var(--primary)]">Open schedule board</Link></Card>
    </div>
  );
}
