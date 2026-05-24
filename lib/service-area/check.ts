import { createAdminClient } from "@/lib/supabase/admin";
import { GREATER_CINCINNATI_BOUNDS, GREATER_CINCINNATI_CITIES, isInGreaterCincinnati } from "./greater-cincinnati";

export type ServiceAreaCheckInput = {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  zip?: string | null;
};

export type ServiceAreaCheckResult = {
  inside: boolean;
  matchedAreaName: string | null;
  message: string;
  source: "database" | "fallback";
};

type ServiceAreaRow = {
  name: string;
  area_type: string;
  zip_codes: string[] | null;
  cities: string[] | null;
  center_lat: number | string | null;
  center_lng: number | string | null;
  radius_miles: number | string | null;
  boundary_geojson: Record<string, unknown> | null;
  outside_area_message: string | null;
  accepts_requests: boolean;
  active: boolean;
};

const defaultOutsideMessage = "This address appears to be outside the current Greater Cincinnati service area.";

function normalizeZip(zip?: string | null) {
  return (zip ?? "").trim().slice(0, 5);
}

function normalizeCity(city?: string | null) {
  return (city ?? "").trim().toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function boundsContain(boundary: Record<string, unknown> | null, latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null || !boundary) return false;
  const north = toNumber(boundary.north as number | string | null);
  const south = toNumber(boundary.south as number | string | null);
  const east = toNumber(boundary.east as number | string | null);
  const west = toNumber(boundary.west as number | string | null);
  if (north == null || south == null || east == null || west == null) return false;
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

function rowMatchesArea(row: ServiceAreaRow, input: ServiceAreaCheckInput) {
  const city = normalizeCity(input.city);
  const zip = normalizeZip(input.zip);
  const cities = (row.cities ?? []).map(normalizeCity).filter(Boolean);
  const zips = (row.zip_codes ?? []).map(normalizeZip).filter(Boolean);

  if (row.area_type === "zip") return Boolean(zip && zips.includes(zip));
  if (row.area_type === "city") return Boolean(city && cities.includes(city));
  if (row.area_type === "bounds") return boundsContain(row.boundary_geojson, input.latitude, input.longitude) || Boolean(city && cities.includes(city)) || Boolean(zip && zips.includes(zip));
  if (row.area_type === "radius") {
    const centerLat = toNumber(row.center_lat);
    const centerLng = toNumber(row.center_lng);
    const radius = toNumber(row.radius_miles);
    if (centerLat == null || centerLng == null || radius == null || input.latitude == null || input.longitude == null) return false;
    return milesBetween(centerLat, centerLng, input.latitude, input.longitude) <= radius;
  }
  if (row.area_type === "polygon") {
    // Polygon support is reserved for the next routing phase. For now, allow city/ZIP fallbacks on polygon rows.
    return Boolean(city && cities.includes(city)) || Boolean(zip && zips.includes(zip));
  }
  return false;
}

function fallbackCheck(input: ServiceAreaCheckInput): ServiceAreaCheckResult {
  const inside = isInGreaterCincinnati(input.latitude, input.longitude) || GREATER_CINCINNATI_CITIES.includes(normalizeCity(input.city));
  return {
    inside,
    matchedAreaName: inside ? "Greater Cincinnati Planning Area" : null,
    message: inside ? "This address is inside the Greater Cincinnati service area." : `${defaultOutsideMessage} Current planning bounds: ${GREATER_CINCINNATI_BOUNDS.south}–${GREATER_CINCINNATI_BOUNDS.north} latitude, ${GREATER_CINCINNATI_BOUNDS.west}–${GREATER_CINCINNATI_BOUNDS.east} longitude.`,
    source: "fallback",
  };
}

export async function checkServiceArea(input: ServiceAreaCheckInput): Promise<ServiceAreaCheckResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_areas")
    .select("name, area_type, zip_codes, cities, center_lat, center_lng, radius_miles, boundary_geojson, outside_area_message, accepts_requests, active")
    .eq("active", true)
    .order("sort_order");

  if (error || !data?.length) return fallbackCheck(input);

  const rows = data as ServiceAreaRow[];
  const matching = rows.find((row) => row.accepts_requests && rowMatchesArea(row, input));
  if (matching) {
    return {
      inside: true,
      matchedAreaName: matching.name,
      message: `This address is inside ${matching.name}.`,
      source: "database",
    };
  }

  return {
    inside: false,
    matchedAreaName: null,
    message: rows.find((row) => row.outside_area_message)?.outside_area_message ?? defaultOutsideMessage,
    source: "database",
  };
}
