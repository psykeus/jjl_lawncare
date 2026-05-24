"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());
const optionalNumber = z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().finite().nullable());

function listFromText(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

const serviceAreaSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Area name is required"),
  areaType: z.enum(["zip", "city", "radius", "bounds", "polygon"]),
  zipCodes: z.array(z.string()).default([]),
  cities: z.array(z.string()).default([]),
  centerLat: optionalNumber,
  centerLng: optionalNumber,
  radiusMiles: optionalNumber,
  north: optionalNumber,
  south: optionalNumber,
  east: optionalNumber,
  west: optionalNumber,
  outsideAreaMessage: z.string().trim().optional().default(""),
  acceptsRequests: checkbox,
  active: checkbox,
  sortOrder: z.coerce.number().int().default(0),
});

function parseServiceArea(formData: FormData) {
  const parsed = serviceAreaSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    areaType: formData.get("areaType"),
    zipCodes: listFromText(formData.get("zipCodes")),
    cities: listFromText(formData.get("cities")),
    centerLat: formData.get("centerLat"),
    centerLng: formData.get("centerLng"),
    radiusMiles: formData.get("radiusMiles"),
    north: formData.get("north"),
    south: formData.get("south"),
    east: formData.get("east"),
    west: formData.get("west"),
    outsideAreaMessage: formData.get("outsideAreaMessage"),
    acceptsRequests: formData.get("acceptsRequests"),
    active: formData.get("active"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) redirect(`/admin/service-areas?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid service area")}`);
  const input = parsed.data;
  const boundary_geojson = input.areaType === "bounds" ? {
    north: input.north,
    south: input.south,
    east: input.east,
    west: input.west,
  } : {};

  return {
    id: input.id,
    name: input.name,
    area_type: input.areaType,
    zip_codes: input.zipCodes,
    cities: input.cities,
    center_lat: input.centerLat,
    center_lng: input.centerLng,
    radius_miles: input.radiusMiles,
    boundary_geojson,
    outside_area_message: input.outsideAreaMessage || null,
    accepts_requests: input.acceptsRequests,
    active: input.active,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertServiceArea(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseServiceArea(formData);
  const supabase = await createClient();
  const { id, ...payload } = input;
  const query = id ? supabase.from("service_areas").update(payload).eq("id", id) : supabase.from("service_areas").insert(payload);
  const { error } = await query;
  if (error) redirect(`/admin/service-areas?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/service-areas");
  revalidatePath("/service-area");
  revalidatePath("/request-quote");
  redirect("/admin/service-areas?saved=1");
}

export async function deactivateServiceArea(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("service_areas").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/service-areas?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/service-areas");
  revalidatePath("/service-area");
}
