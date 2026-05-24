"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateServiceUpsells(formData: FormData) {
  await requireRole(["admin"]);
  const serviceId = String(formData.get("serviceId") ?? "");
  const upsellIds = formData.getAll("upsellServiceIds").map(String).filter(Boolean);
  const supabase = await createClient();

  const { error: deactivateError } = await supabase
    .from("service_upsells")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("core_service_id", serviceId);
  if (deactivateError) redirect(`/admin/services/${serviceId}/upsells?error=${encodeURIComponent(deactivateError.message)}`);

  for (const [index, upsellId] of upsellIds.entries()) {
    const { error } = await supabase.from("service_upsells").upsert({
      core_service_id: serviceId,
      upsell_service_id: upsellId,
      sort_order: index * 10,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "core_service_id,upsell_service_id" });
    if (error) redirect(`/admin/services/${serviceId}/upsells?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/admin/services/${serviceId}/upsells`);
  revalidatePath("/request-quote");
  redirect(`/admin/services/${serviceId}/upsells?saved=1`);
}
