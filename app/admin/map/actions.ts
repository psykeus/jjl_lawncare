"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { geocodeAddress } from "@/lib/maps/geocode";
import { createClient } from "@/lib/supabase/server";

export async function geocodeUnmappedProperties() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, address_line_1, city, state, zip")
    .or("latitude.is.null,longitude.is.null")
    .eq("active", true)
    .limit(50);

  if (error) redirect(`/admin/map?error=${encodeURIComponent(error.message)}`);

  let updated = 0;
  for (const property of properties ?? []) {
    const coordinates = await geocodeAddress(`${property.address_line_1}, ${property.city}, ${property.state} ${property.zip}`);
    if (!coordinates) continue;
    const { error: updateError } = await supabase
      .from("properties")
      .update({ latitude: coordinates.latitude, longitude: coordinates.longitude })
      .eq("id", property.id);
    if (!updateError) updated += 1;
  }

  revalidatePath("/admin/map");
  revalidatePath("/admin/jobs");
  redirect(`/admin/map?geocoded=${updated}`);
}
