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
  latitude?: number | null;
  longitude?: number | null;
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

export function availableCrewCountAt(availability: CrewAvailability[], start: number, end = start) {
  return availability.filter((row) => {
    const availableStart = timeToMinutes(row.startTime);
    const availableEnd = timeToMinutes(row.endTime);
    if (availableStart == null || availableEnd == null) return false;
    return availableStart <= start && availableEnd >= end;
  }).length;
}

export function jobWorkloadMinutes(job: PlannerJob) {
  return Math.max(15, Number(job.estimatedDurationMinutes ?? 60)) * Math.max(1, Number(job.requiredCrewSize ?? 1));
}

export function routeBufferMinutes(jobCount: number, legMinutes?: Array<number | null | undefined>) {
  if (legMinutes?.length) return legMinutes.reduce<number>((sum, minutes) => sum + Math.max(0, Number(minutes ?? 15)), 0);
  return Math.max(0, jobCount - 1) * 15;
}

function distanceMiles(a: PlannerJob, b: PlannerJob) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function routeSeedSort(a: PlannerJob, b: PlannerJob) {
  const aStart = timeToMinutes(a.scheduledStartTime ?? a.earliestStartTime) ?? 9999;
  const bStart = timeToMinutes(b.scheduledStartTime ?? b.earliestStartTime) ?? 9999;
  if (aStart !== bStart) return aStart - bStart;
  const priority = Number(b.routePriority ?? 0) - Number(a.routePriority ?? 0);
  if (priority) return priority;
  return `${a.city} ${a.address}`.localeCompare(`${b.city} ${b.address}`);
}

export function sortJobsForRoute(jobs: PlannerJob[]) {
  const remaining = [...jobs].sort(routeSeedSort);
  const route: PlannerJob[] = [];
  let current = remaining.shift();
  if (!current) return route;
  route.push(current);

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    const anchor = current;
    remaining.forEach((candidate, index) => {
      const scheduled = timeToMinutes(candidate.scheduledStartTime ?? candidate.earliestStartTime) ?? 720;
      const distance = distanceMiles(anchor, candidate);
      const distanceScore = distance == null ? 25 : distance;
      const priorityBonus = Number(candidate.routePriority ?? 0) * 2;
      const timeScore = scheduled / 120;
      const score = distanceScore + timeScore - priorityBonus;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    const next = remaining.splice(bestIndex, 1)[0];
    if (!next) break;
    current = next;
    route.push(current);
  }
  return route;
}

export function buildRouteTimeline(jobs: PlannerJob[], dayStart = 9 * 60, availability: CrewAvailability[] = [], legMinutes?: Array<number | null | undefined>) {
  const sorted = sortJobsForRoute(jobs);
  let cursor = dayStart;
  return sorted.map((job, index) => {
    const travelBefore = index > 0 ? Math.max(0, Number(legMinutes?.[index - 1] ?? 15)) : 0;
    if (index > 0) cursor += travelBefore;
    const windowStart = timeToMinutes(job.earliestStartTime);
    if (windowStart != null && cursor < windowStart) cursor = windowStart;
    const scheduledStart = timeToMinutes(job.scheduledStartTime);
    if (scheduledStart != null) cursor = scheduledStart;
    const duration = Math.max(15, Number(job.estimatedDurationMinutes ?? 60));
    const start = cursor;
    const end = start + duration;
    cursor = end;
    const latestEnd = timeToMinutes(job.latestEndTime);
    const crewAvailable = availability.length ? availableCrewCountAt(availability, start, end) : 0;
    const warnings = [
      latestEnd != null && end > latestEnd ? `Past latest window by ${end - latestEnd} minutes` : null,
      availability.length && crewAvailable < Number(job.requiredCrewSize ?? 1) ? `Needs ${job.requiredCrewSize ?? 1} crew, ${crewAvailable} available at this time` : null,
    ].filter((warning): warning is string => Boolean(warning));
    return {
      job,
      start,
      end,
      crewAvailable,
      travelBefore,
      warning: warnings[0] ?? null,
      warnings,
    };
  });
}

export function findCapacityWarnings(jobs: PlannerJob[], availability: CrewAvailability[], legMinutes?: Array<number | null | undefined>) {
  const crewMinutes = availabilityMinutes(availability);
  const workload = jobs.reduce((sum, job) => sum + jobWorkloadMinutes(job), 0);
  const travel = routeBufferMinutes(jobs.length, legMinutes);
  const total = workload + travel;
  const warnings: string[] = [];
  if (!availability.length) warnings.push("No crew availability is entered for this day.");
  if (total > crewMinutes) warnings.push(`Day is overbooked by ${Math.ceil(total - crewMinutes)} crew-minutes.`);
  for (const entry of buildRouteTimeline(jobs, availability[0]?.startTime ? (timeToMinutes(availability[0].startTime) ?? 9 * 60) : 9 * 60, availability, legMinutes)) {
    for (const warning of entry.warnings) warnings.push(`${entry.job.customerName}: ${warning}.`);
  }
  return { crewMinutes, workload, travel, total, remaining: crewMinutes - total, warnings };
}
