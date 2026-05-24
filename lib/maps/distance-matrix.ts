import { getGoogleMapsServerKey } from "./config";

export type RouteStop = {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
};

export type DrivingLegEstimate = {
  fromIndex: number;
  toIndex: number;
  distanceText: string | null;
  durationText: string | null;
  durationMinutes: number | null;
  status: string;
};

function stopToLocation(stop: RouteStop) {
  if (stop.latitude != null && stop.longitude != null) return `${stop.latitude},${stop.longitude}`;
  return [stop.address, stop.city].filter(Boolean).join(", ");
}

export function fallbackLegMinutes(stops: RouteStop[]) {
  return Array.from({ length: Math.max(0, stops.length - 1) }, (_, index) => ({
    fromIndex: index,
    toIndex: index + 1,
    distanceText: null,
    durationText: "15 min buffer",
    durationMinutes: 15,
    status: "FALLBACK",
  } satisfies DrivingLegEstimate));
}

export async function estimateDrivingLegs(stops: RouteStop[]): Promise<{ source: "google" | "fallback"; legs: DrivingLegEstimate[]; error?: string }> {
  const routeStops = stops.filter((stop) => stopToLocation(stop));
  if (routeStops.length < 2) return { source: "fallback", legs: [] };

  const key = getGoogleMapsServerKey();
  if (!key) return { source: "fallback", legs: fallbackLegMinutes(routeStops), error: "No Google Maps server key configured; using 15-minute travel buffers." };

  const origins = routeStops.slice(0, -1).map(stopToLocation);
  const destinations = routeStops.slice(1).map(stopToLocation);
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origins.join("|"));
  url.searchParams.set("destinations", destinations.join("|"));
  url.searchParams.set("mode", "driving");
  url.searchParams.set("units", "imperial");
  url.searchParams.set("key", key);

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 10 } });
    if (!response.ok) return { source: "fallback", legs: fallbackLegMinutes(routeStops), error: `Distance Matrix request failed: ${response.status}` };
    const body = await response.json() as {
      status?: string;
      error_message?: string;
      rows?: Array<{ elements?: Array<{ status?: string; distance?: { text?: string }; duration?: { text?: string; value?: number } }> }>;
    };
    if (body.status !== "OK") return { source: "fallback", legs: fallbackLegMinutes(routeStops), error: body.error_message ?? `Distance Matrix status: ${body.status ?? "unknown"}` };

    const legs = origins.map((_, index) => {
      const element = body.rows?.[index]?.elements?.[index];
      const seconds = element?.duration?.value;
      return {
        fromIndex: index,
        toIndex: index + 1,
        distanceText: element?.distance?.text ?? null,
        durationText: element?.duration?.text ?? null,
        durationMinutes: seconds ? Math.max(1, Math.ceil(seconds / 60)) : 15,
        status: element?.status ?? "UNKNOWN",
      } satisfies DrivingLegEstimate;
    });

    return { source: "google", legs };
  } catch (error) {
    return { source: "fallback", legs: fallbackLegMinutes(routeStops), error: error instanceof Error ? error.message : "Distance Matrix request failed" };
  }
}
