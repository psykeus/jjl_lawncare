import { NextResponse } from "next/server";
import { checkServiceArea } from "@/lib/service-area/check";

function parseNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await checkServiceArea({
    latitude: parseNumber(url.searchParams.get("lat")),
    longitude: parseNumber(url.searchParams.get("lng")),
    city: url.searchParams.get("city"),
    zip: url.searchParams.get("zip"),
  });
  return NextResponse.json(result);
}
