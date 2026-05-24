"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function upsertCrewAvailability(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "") || null;
  const payload = {
    profile_id: String(formData.get("profileId") ?? ""),
    available_date: String(formData.get("availableDate") ?? ""),
    start_time: String(formData.get("startTime") ?? ""),
    end_time: String(formData.get("endTime") ?? ""),
    max_hours: Number(formData.get("maxHours") || 0) || null,
    notes: String(formData.get("notes") ?? "") || null,
    active: formData.get("active") === "on",
    updated_at: new Date().toISOString(),
  };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("crew_availability").update(payload).eq("id", id) : await supabase.from("crew_availability").insert(payload);
  if (error) redirect(`/admin/crew/availability?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/crew/availability");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/routes");
  redirect("/admin/crew/availability?saved=1");
}

export async function deactivateCrewAvailability(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("crew_availability").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/crew/availability?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/crew/availability");
}
