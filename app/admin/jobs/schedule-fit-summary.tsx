import Link from "next/link";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { buildRouteTimeline, findCapacityWarnings, minutesToTime, type CrewAvailability, type PlannerJob } from "@/lib/schedule/planner";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

function timeToInput(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export async function ScheduleFitSummary({
  scheduledDate,
  scheduledStartTime,
  estimatedDurationMinutes = 60,
  requiredCrewSize = 1,
  excludeJobId,
}: {
  scheduledDate?: string | null;
  scheduledStartTime?: string | null;
  estimatedDurationMinutes?: number | string | null;
  requiredCrewSize?: number | string | null;
  excludeJobId?: string;
}) {
  const duration = Math.max(15, Number(estimatedDurationMinutes ?? 60));
  const crewNeeded = Math.max(1, Number(requiredCrewSize ?? 1));

  if (!scheduledDate) {
    return (
      <Card className="border-dashed p-4">
        <h2 className="text-lg font-bold">Schedule fit</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Choose a scheduled date to check crew capacity, existing workload, and route pressure before saving.</p>
        <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]" href={`/admin/schedule/slots?duration=${duration}&crew=${crewNeeded}`}>Find candidate slots</Link>
      </Card>
    );
  }

  const supabase = await createClient();
  let jobsQuery = supabase
    .from("jobs")
    .select("id, status, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_duration_minutes, required_crew_size, earliest_start_time, latest_end_time, route_priority, customers(name), properties(address_line_1, city, latitude, longitude)")
    .eq("scheduled_date", scheduledDate)
    .neq("status", "cancelled");
  if (excludeJobId) jobsQuery = jobsQuery.neq("id", excludeJobId);

  const [{ data: jobs }, { data: availability }] = await Promise.all([
    jobsQuery,
    supabase.from("crew_availability").select("id, start_time, end_time, max_hours, profiles(name, email)").eq("available_date", scheduledDate).eq("active", true),
  ]);

  const plannerJobs: PlannerJob[] = (jobs ?? []).map((job) => {
    const customer = one(job.customers);
    const property = one(job.properties);
    return {
      id: job.id,
      customerName: customer?.name ?? "Unknown",
      address: property?.address_line_1 ?? "",
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
  const candidate: PlannerJob = {
    id: excludeJobId ?? "candidate",
    customerName: excludeJobId ? "This job" : "New job",
    address: "",
    city: "",
    status: "scheduled",
    scheduledDate,
    scheduledStartTime: scheduledStartTime || null,
    scheduledEndTime: null,
    estimatedDurationMinutes: duration,
    requiredCrewSize: crewNeeded,
    earliestStartTime: null,
    latestEndTime: null,
    routePriority: 0,
  };
  const capacity = findCapacityWarnings([...plannerJobs, candidate], crewAvailability);
  const timeline = buildRouteTimeline([...plannerJobs, candidate], crewAvailability[0]?.startTime ? (Number(crewAvailability[0].startTime.split(":")[0]) * 60 + Number(crewAvailability[0].startTime.split(":")[1])) : 9 * 60, crewAvailability);
  const candidateEntry = timeline.find((entry) => entry.job.id === candidate.id);
  const suggestedStart = candidateEntry?.start ?? timeline.at(-1)?.end ?? 9 * 60;
  const slotHref = `/admin/schedule/slots?duration=${duration}&crew=${crewNeeded}`;
  const applyHref = `/admin/jobs/new?scheduledDate=${scheduledDate}&scheduledStartTime=${timeToInput(suggestedStart)}&estimatedDurationMinutes=${duration}&requiredCrewSize=${crewNeeded}`;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Schedule fit for {formatDate(scheduledDate)}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Includes {plannerJobs.length} existing job{plannerJobs.length === 1 ? "" : "s"}, {crewAvailability.length} available crew row{crewAvailability.length === 1 ? "" : "s"}, {duration} minutes, and {crewNeeded} required crew.</p>
        </div>
        <Link className="text-sm font-semibold text-[var(--primary)]" href={slotHref}>Find better slots</Link>
      </div>
      <div className={`mt-3 rounded-xl p-3 text-sm ${capacity.warnings.length ? "tone-warning text-[var(--warning)]" : "tone-success text-[var(--success)]"}`}>
        <strong>{capacity.warnings.length ? "Review before saving" : "Looks schedulable"}</strong>
        <p className="mt-1">Remaining crew-minutes after this job: {capacity.remaining}. Suggested route start: {minutesToTime(suggestedStart)}.</p>
        {capacity.warnings.length ? <ul className="mt-2 list-disc pl-5">{capacity.warnings.slice(0, 4).map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
      </div>
      {!excludeJobId ? <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" href={applyHref}>Use suggested start</Link> : null}
    </Card>
  );
}
