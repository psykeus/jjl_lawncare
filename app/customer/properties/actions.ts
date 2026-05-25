"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updatePropertyNotes(formData: FormData) {
  await requireRole(["customer", "admin"]);
  const propertyId = String(formData.get("propertyId") ?? "");
  const gateNotes = String(formData.get("gateNotes") ?? "").trim();
  const petNotes = String(formData.get("petNotes") ?? "").trim();
  const hazardNotes = String(formData.get("hazardNotes") ?? "").trim();
  const yardSize = String(formData.get("yardSize") ?? "").trim();
  if (!propertyId) redirect("/customer/properties?error=Property not found");

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({
      gate_notes: gateNotes || null,
      pet_notes: petNotes || null,
      hazard_notes: hazardNotes || null,
      yard_size: yardSize || null,
    })
    .eq("id", propertyId);

  if (error) redirect(`/customer/properties?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/customer/properties");
  redirect("/customer/properties?saved=1");
}
