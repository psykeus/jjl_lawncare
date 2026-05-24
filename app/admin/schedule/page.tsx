import Link from "next/link";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { availabilityMinutes, buildRouteTimeline, findCapacityWarnings, jobWorkloadMinutes, minutesToTime, type CrewAvailability, type PlannerJob } from "@/lib/schedule/planner";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
function today() { return new Date().toISOString().slice(0, 10); }

export default async function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; duration?: string; crew?: string }> }) {
  const params = await searchParams;
  const date = params.date ?? today();
  const supabase = await createClient();
  const [{ data: jobs, error: jobError }, { data: availability }] = await Promise.all([
    supabase.from("jobs").select("id, status, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_duration_minutes, required_crew_size, earliest_start_time, latest_end_time, route_priority, customers(name), properties(address_line_1, city, latitude, longitude)").eq("scheduled_date", date).neq("status", "cancelled").order("scheduled_start_time"),
    supabase.from("crew_availability").select("id, start_time, end_time, max_hours, profiles(name, email)").eq("available_date", date).eq("active", true).order("start_time"),
  ]);

  const plannerJobs: PlannerJob[] = (jobs ?? []).map((job) => {
    const customer = one(job.customers);
    const property = one(job.properties);
    return {
      id: job.id,
      customerName: customer?.name ?? "Unknown customer",
      address: property?.address_line_1 ?? "No address",
      city: property?.city ?? "",
      status: job.status,
      scheduledDate: job.scheduled_date,
      scheduledStartTime: job.scheduled_start_time,
      scheduledEndTime: job.scheduled_end_time,
      estimatedDurationMinutes: job.estimated_duration_minutes,
      requiredCrewSize: job.required_crew_size,
      earliestStartTime: job.earliest_start_time,
      latestEndTime: job.latest_end_time,
      routePriority: job.route_priority,
      latitude: property?.latitude ? Number(property.latitude) : null,
      longitude: property?.longitude ? Number(property.longitude) : null,
    };
  });
  const crewAvailability: CrewAvailability[] = (availability ?? []).map((row) => {
    const profile = one(row.profiles);
    return { id: row.id, crewName: profile?.name ?? profile?.email ?? "Crew", startTime: row.start_time, endTime: row.end_time, maxHours: row.max_hours ? Number(row.max_hours) : null };
  });
  const capacity = findCapacityWarnings(plannerJobs, crewAvailability);
  const newDuration = Number(params.duration ?? 60);
  const newCrew = Number(params.crew ?? 1);
  const newWorkload = newDuration * newCrew + (plannerJobs.length ? 15 : 0);
  const timeline = buildRouteTimeline(plannerJobs, crewAvailability[0]?.startTime ? Number(crewAvailability[0].startTime.split(":")[0]) * 60 + Number(crewAvailability[0].startTime.split(":")[1]) : 9 * 60, crewAvailability);
  const lastEnd = timeline.at(-1)?.end ?? (crewAvailability[0]?.startTime ? Number(crewAvailability[0].startTime.split(":")[0]) * 60 + Number(crewAvailability[0].startTime.split(":")[1]) : 9 * 60);
  const suggestedStart = lastEnd + (plannerJobs.length ? 15 : 0);
  const dayHasSlot = capacity.remaining >= newWorkload;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Schedule board</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Daily workload, crew capacity, time-window warnings, and overbooking checks.</p>
          {jobError ? <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Scheduling columns are not available yet. Apply db/migrations/007_scheduling_planning.sql.</div> : null}
        </div>
        <form className="flex gap-2"><input className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm" name="date" type="date" defaultValue={date} /><button className="h-10 rounded-lg bg-[var(--primary)] px-4 font-semibold text-white">View</button></form>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-[var(--muted-foreground)]">Crew capacity</div><div className="mt-2 text-2xl font-black">{Math.round(availabilityMinutes(crewAvailability))} min</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Job workload</div><div className="mt-2 text-2xl font-black">{capacity.workload} min</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Travel buffer</div><div className="mt-2 text-2xl font-black">{capacity.travel} min</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Remaining</div><div className={`mt-2 text-2xl font-black ${capacity.remaining < 0 ? "text-[var(--danger)]" : "text-green-700"}`}>{capacity.remaining} min</div></Card>
      </div>

      {capacity.warnings.length ? <Card className="border-red-200 bg-red-50"><h2 className="font-bold text-[var(--danger)]">Warnings</h2><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-900">{capacity.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></Card> : <Card className="border-green-200 bg-green-50 text-sm text-green-800">No overbooking warnings for {formatDate(date)}.</Card>}

      <Card>
        <h2 className="text-xl font-bold">Potential time-slot finder</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_120px_auto]">
          <label className="grid gap-2 text-sm font-medium">Date<input className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm" name="date" type="date" defaultValue={date} /></label>
          <label className="grid gap-2 text-sm font-medium">Minutes<input className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm" name="duration" type="number" defaultValue={newDuration} min="15" /></label>
          <label className="grid gap-2 text-sm font-medium">Crew<input className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm" name="crew" type="number" defaultValue={newCrew} min="1" /></label>
          <button className="self-end rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white">Check slot</button>
        </form>
        <div className={`mt-4 rounded-xl p-4 text-sm ${dayHasSlot ? "bg-green-50 text-green-800" : "bg-red-50 text-red-900"}`}>
          {dayHasSlot ? <>Suggested slot: start around <strong>{minutesToTime(suggestedStart)}</strong>. This adds about {newWorkload} crew-minutes including route buffer.</> : <>This day is full or overbooked for a {newDuration}-minute job needing {newCrew} crew. It needs {newWorkload} crew-minutes, but only {capacity.remaining} remain.</>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm"><thead className="bg-[var(--muted)]"><tr><th className="p-3">Job</th><th className="p-3">Window</th><th className="p-3">Workload</th><th className="p-3">Crew</th><th className="p-3">Status</th></tr></thead><tbody>{plannerJobs.map((job) => <tr key={job.id} className="border-t border-[var(--border)]"><td className="p-3 font-semibold"><Link href={`/admin/jobs/${job.id}`}>{job.customerName}</Link><div className="text-xs font-normal text-[var(--muted-foreground)]">{job.address}, {job.city}</div></td><td className="p-3">{job.scheduledStartTime ?? job.earliestStartTime ?? "—"}–{job.scheduledEndTime ?? job.latestEndTime ?? "—"}</td><td className="p-3">{jobWorkloadMinutes(job)} crew-min</td><td className="p-3">{job.requiredCrewSize ?? 1}</td><td className="p-3">{job.status}</td></tr>)}{plannerJobs.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={5}>No jobs scheduled for this day.</td></tr>}</tbody></table>
        </Card>
        <Card><h2 className="text-xl font-bold">Available crew</h2><div className="mt-4 grid gap-3 text-sm">{crewAvailability.map((row) => <div key={row.id} className="rounded-lg bg-[var(--muted)] p-3"><strong>{row.crewName}</strong><br />{minutesToTime(Number(row.startTime.split(":")[0]) * 60 + Number(row.startTime.split(":")[1]))}–{minutesToTime(Number(row.endTime.split(":")[0]) * 60 + Number(row.endTime.split(":")[1]))}</div>)}{crewAvailability.length ? null : <p className="text-[var(--muted-foreground)]">No availability entered. <Link href="/admin/crew/availability" className="font-semibold text-[var(--primary)]">Add availability</Link>.</p>}</div></Card>
      </div>
    </div>
  );
}
