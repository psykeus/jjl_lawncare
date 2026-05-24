"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateCustomerAccount(formData: FormData) {
  const profile = await requireRole(["customer", "admin"]);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2) redirect("/customer/account?error=Name is required");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name, phone: phone || null }).eq("id", profile.id);
  if (error) redirect(`/customer/account?error=${encodeURIComponent(error.message)}`);
  await supabase.from("customers").update({ name, phone: phone || null }).eq("profile_id", profile.id);
  revalidatePath("/customer/account");
  redirect("/customer/account?saved=1");
}
