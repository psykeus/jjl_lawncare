export type PlannerJob = {
  id: string;
  customerName: string;
  address: string;
  city: string;
  status: string;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  estimatedDurationMinutes: number | null;
  requiredCrewSize: number | null;
  earliestStartTime: string | null;
  latestEndTime: string | null;
  routePriority: number | null;
};

export type CrewAvailability = {
  id: string;
  crewName: string;
  startTime: string;
  endTime: string;
  maxHours: number | null;
};

export function timeToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function availabilityMinutes(availability: CrewAvailability[]) {
  return availability.reduce((sum, row) => {
    const start = timeToMinutes(row.startTime);
    const end = timeToMinutes(row.endTime);
    if (start == null || end == null || end <= start) return sum;
    const minutes = end - start;
    const capped = row.maxHours ? Math.min(minutes, row.maxHours * 60) : minutes;
    return sum + capped;
  }, 0);
}

export function jobWorkloadMinutes(job: PlannerJob) {
  return Math.max(15, Number(job.estimatedDurationMinutes ?? 60)) * Math.max(1, Number(job.requiredCrewSize ?? 1));
}

export function routeBufferMinutes(jobCount: number) {
  return Math.max(0, jobCount - 1) * 15;
}

export function sortJobsForRoute(jobs: PlannerJob[]) {
  return [...jobs].sort((a, b) => {
    const priority = Number(b.routePriority ?? 0) - Number(a.routePriority ?? 0);
    if (priority) return priority;
    const aStart = timeToMinutes(a.scheduledStartTime ?? a.earliestStartTime) ?? 9999;
    const bStart = timeToMinutes(b.scheduledStartTime ?? b.earliestStartTime) ?? 9999;
    if (aStart !== bStart) return aStart - bStart;
    return `${a.city} ${a.address}`.localeCompare(`${b.city} ${b.address}`);
  });
}

export function buildRouteTimeline(jobs: PlannerJob[], dayStart = 9 * 60) {
  const sorted = sortJobsForRoute(jobs);
  let cursor = dayStart;
  return sorted.map((job, index) => {
    if (index > 0) cursor += 15;
    const windowStart = timeToMinutes(job.earliestStartTime);
    if (windowStart != null && cursor < windowStart) cursor = windowStart;
    const scheduledStart = timeToMinutes(job.scheduledStartTime);
    if (scheduledStart != null) cursor = scheduledStart;
    const duration = Math.max(15, Number(job.estimatedDurationMinutes ?? 60));
    const start = cursor;
    const end = start + duration;
    cursor = end;
    const latestEnd = timeToMinutes(job.latestEndTime);
    return {
      job,
      start,
      end,
      warning: latestEnd != null && end > latestEnd ? `Past latest window by ${end - latestEnd} minutes` : null,
    };
  });
}

export function findCapacityWarnings(jobs: PlannerJob[], availability: CrewAvailability[]) {
  const crewMinutes = availabilityMinutes(availability);
  const workload = jobs.reduce((sum, job) => sum + jobWorkloadMinutes(job), 0);
  const travel = routeBufferMinutes(jobs.length);
  const total = workload + travel;
  const warnings: string[] = [];
  if (!availability.length) warnings.push("No crew availability is entered for this day.");
  if (total > crewMinutes) warnings.push(`Day is overbooked by ${Math.ceil(total - crewMinutes)} crew-minutes.`);
  for (const job of jobs) {
    const availableCrew = availability.length;
    if (Number(job.requiredCrewSize ?? 1) > availableCrew) warnings.push(`${job.customerName} requires ${job.requiredCrewSize} crew, but only ${availableCrew} are available.`);
  }
  for (const entry of buildRouteTimeline(jobs)) {
    if (entry.warning) warnings.push(`${entry.job.customerName}: ${entry.warning}.`);
  }
  return { crewMinutes, workload, travel, total, remaining: crewMinutes - total, warnings };
}
