"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function acceptEstimate(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");

  const documentId = String(formData.get("documentId") ?? "");
  const acceptedName = String(formData.get("acceptedName") ?? "").trim();
  const acceptedTerms = formData.get("acceptedTerms") === "on";
  if (!documentId || acceptedName.length < 2 || !acceptedTerms) {
    redirect(`/customer/estimates/${documentId}?error=Type your name and accept the terms to continue`);
  }

  const supabase = createAdminClient();
  const { data: estimate } = await supabase
    .from("documents")
    .select("id, status, customer_id, property_id, terms_version_id, total, customers(profile_id, email)")
    .eq("id", documentId)
    .eq("document_type", "estimate")
    .maybeSingle();

  if (!estimate) redirect(`/customer/estimates/${documentId}?error=Estimate not found`);
  const customer = Array.isArray(estimate.customers) ? estimate.customers[0] : estimate.customers;
  const isOwner = profile.role === "admin" || customer?.profile_id === profile.id || customer?.email?.toLowerCase() === profile.email?.toLowerCase();
  if (!isOwner) redirect("/customer/dashboard");
  if (!["sent", "viewed"].includes(String(estimate.status))) redirect(`/customer/estimates/${documentId}?error=Only sent estimates can be accepted`);

  const acceptedAt = new Date().toISOString();
  await supabase
    .from("documents")
    .update({ status: "accepted", accepted_at: acceptedAt, balance_due: estimate.total })
    .eq("id", documentId);

  if (estimate.terms_version_id) {
    await supabase.from("terms_acceptances").insert({
      customer_id: estimate.customer_id,
      property_id: estimate.property_id,
      document_id: estimate.id,
      terms_version_id: estimate.terms_version_id,
      accepted_name: acceptedName,
      accepted_at: acceptedAt,
    });
  }

  await supabase.from("activity_log").insert({
    actor_id: profile.id,
    action: "estimate.accepted",
    related_type: "document",
    related_id: estimate.id,
    metadata_json: { acceptedName },
  });

  revalidatePath("/customer/estimates");
  redirect(`/customer/estimates/${documentId}?accepted=1`);
}
