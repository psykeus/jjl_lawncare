"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());
const money = z.preprocess((value) => value === "" || value == null ? 0 : Number(value), z.number().finite());

const questionSchema = z.object({
  id: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  questionText: z.string().trim().min(3, "Question text is required"),
  questionType: z.enum(["single_choice", "multi_choice", "yes_no", "short_text", "number"]),
  required: checkbox,
  helpText: z.string().trim().optional().default(""),
  active: checkbox,
  sortOrder: z.coerce.number().int().default(0),
});

const optionSchema = z.object({
  id: z.string().uuid().optional(),
  questionId: z.string().uuid(),
  serviceId: z.string().uuid(),
  label: z.string().trim().min(1, "Option label is required"),
  value: z.string().trim().optional().default(""),
  priceModifier: money,
  durationModifierMinutes: z.coerce.number().int().default(0),
  riskModifier: z.enum(["none", "low", "medium", "high"]),
  requiresParentApproval: checkbox,
  active: checkbox,
  sortOrder: z.coerce.number().int().default(0),
});

function slugValue(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "option";
}

export async function upsertServiceQuestion(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = questionSchema.safeParse({
    id: formData.get("id") || undefined,
    serviceId: formData.get("serviceId"),
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    required: formData.get("required"),
    helpText: formData.get("helpText"),
    active: formData.get("active"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect(`/admin/services?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid question")}`);
  const input = parsed.data;
  const supabase = await createClient();
  const payload = {
    service_id: input.serviceId,
    question_text: input.questionText,
    question_type: input.questionType,
    required: input.required,
    help_text: input.helpText || null,
    active: input.active,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("service_questions").update(payload).eq("id", input.id)
    : await supabase.from("service_questions").insert(payload);
  if (error) redirect(`/admin/services/${input.serviceId}/questions?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/services/${input.serviceId}/questions`);
  revalidatePath("/request-quote");
  redirect(`/admin/services/${input.serviceId}/questions?saved=1`);
}

export async function upsertServiceQuestionOption(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = optionSchema.safeParse({
    id: formData.get("id") || undefined,
    questionId: formData.get("questionId"),
    serviceId: formData.get("serviceId"),
    label: formData.get("label"),
    value: formData.get("value"),
    priceModifier: formData.get("priceModifier"),
    durationModifierMinutes: formData.get("durationModifierMinutes") || 0,
    riskModifier: formData.get("riskModifier") || "none",
    requiresParentApproval: formData.get("requiresParentApproval"),
    active: formData.get("active"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect(`/admin/services?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid option")}`);
  const input = parsed.data;
  const supabase = await createClient();
  const payload = {
    question_id: input.questionId,
    label: input.label,
    value: input.value || slugValue(input.label),
    price_modifier: input.priceModifier,
    duration_modifier_minutes: input.durationModifierMinutes,
    risk_modifier: input.riskModifier,
    requires_parent_approval: input.requiresParentApproval,
    active: input.active,
    sort_order: input.sortOrder,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await supabase.from("service_question_options").update(payload).eq("id", input.id)
    : await supabase.from("service_question_options").insert(payload);
  if (error) redirect(`/admin/services/${input.serviceId}/questions?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/services/${input.serviceId}/questions`);
  revalidatePath("/request-quote");
  redirect(`/admin/services/${input.serviceId}/questions?saved=1`);
}

export async function deactivateServiceQuestion(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("service_questions").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/services/${serviceId}/questions?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/services/${serviceId}/questions`);
}

export async function deactivateServiceQuestionOption(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("service_question_options").update({ active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/services/${serviceId}/questions?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/services/${serviceId}/questions`);
}
