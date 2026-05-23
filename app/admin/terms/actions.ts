"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

const termsSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Title is required"),
  version: z.string().trim().min(1, "Version is required"),
  body: z.string().trim().min(20, "Terms body must be at least 20 characters"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  active: checkbox,
  requiredForQuoteRequest: checkbox,
  requiredForEstimateAcceptance: checkbox,
});

function parseTerms(formData: FormData) {
  const parsed = termsSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    version: formData.get("version"),
    body: formData.get("body"),
    effectiveDate: formData.get("effectiveDate"),
    active: formData.get("active"),
    requiredForQuoteRequest: formData.get("requiredForQuoteRequest"),
    requiredForEstimateAcceptance: formData.get("requiredForEstimateAcceptance"),
  });
  if (!parsed.success) redirect(`/admin/terms?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid terms version")}`);
  return parsed.data;
}

async function deactivateOtherActiveTerms(title: string, id?: string) {
  const supabase = await createClient();
  let query = supabase.from("terms_versions").update({ active: false }).eq("title", title).eq("active", true);
  if (id) query = query.neq("id", id);
  await query;
}

export async function createTermsVersion(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseTerms(formData);
  const supabase = await createClient();
  if (input.active) await deactivateOtherActiveTerms(input.title);
  const { error } = await supabase.from("terms_versions").insert({
    title: input.title,
    version: input.version,
    body: input.body,
    effective_date: input.effectiveDate,
    active: input.active,
    required_for_quote_request: input.requiredForQuoteRequest,
    required_for_estimate_acceptance: input.requiredForEstimateAcceptance,
  });
  if (error) redirect(`/admin/terms?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/terms");
  revalidatePath("/terms");
  redirect("/admin/terms?saved=1");
}

export async function updateTermsVersion(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseTerms(formData);
  if (!input.id) redirect("/admin/terms?error=Missing terms id");
  const supabase = await createClient();
  if (input.active) await deactivateOtherActiveTerms(input.title, input.id);
  const { error } = await supabase
    .from("terms_versions")
    .update({
      title: input.title,
      version: input.version,
      body: input.body,
      effective_date: input.effectiveDate,
      active: input.active,
      required_for_quote_request: input.requiredForQuoteRequest,
      required_for_estimate_acceptance: input.requiredForEstimateAcceptance,
    })
    .eq("id", input.id);
  if (error) redirect(`/admin/terms?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/terms");
  revalidatePath("/terms");
  redirect("/admin/terms?saved=1");
}

export async function activateTermsVersion(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const supabase = await createClient();
  await deactivateOtherActiveTerms(title, id);
  const { error } = await supabase.from("terms_versions").update({ active: true }).eq("id", id);
  if (error) redirect(`/admin/terms?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/terms");
  revalidatePath("/terms");
}
