"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Template name is required"),
  serviceId: z.string().uuid().nullable().optional(),
  active: checkbox,
});

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  label: z.string().trim().min(2, "Checklist item label is required"),
  required: checkbox,
  active: checkbox,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function parseTemplate(formData: FormData) {
  const parsed = templateSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    serviceId: formData.get("serviceId") || null,
    active: formData.get("active"),
  });
  if (!parsed.success) redirect(`/admin/checklists?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid checklist template")}`);
  return parsed.data;
}

function parseItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    id: formData.get("id") || undefined,
    templateId: formData.get("templateId"),
    label: formData.get("label"),
    required: formData.get("required"),
    active: formData.get("active"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect(`/admin/checklists?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid checklist item")}`);
  return parsed.data;
}

export async function createChecklistTemplate(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseTemplate(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_templates").insert({
    name: input.name,
    service_id: input.serviceId,
    active: input.active,
  });
  if (error) redirect(`/admin/checklists?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/checklists");
  redirect("/admin/checklists?saved=1");
}

export async function updateChecklistTemplate(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseTemplate(formData);
  if (!input.id) redirect("/admin/checklists?error=Missing template id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_templates")
    .update({ name: input.name, service_id: input.serviceId, active: input.active })
    .eq("id", input.id);
  if (error) redirect(`/admin/checklists?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/checklists");
  redirect("/admin/checklists?saved=1");
}

export async function createChecklistItem(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseItem(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_items").insert({
    checklist_template_id: input.templateId,
    label: input.label,
    required: input.required,
    active: input.active,
    sort_order: input.sortOrder,
  });
  if (error) redirect(`/admin/checklists?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/checklists");
  redirect("/admin/checklists?saved=1");
}

export async function updateChecklistItem(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseItem(formData);
  if (!input.id) redirect("/admin/checklists?error=Missing item id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ label: input.label, required: input.required, active: input.active, sort_order: input.sortOrder })
    .eq("id", input.id);
  if (error) redirect(`/admin/checklists?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/checklists");
  redirect("/admin/checklists?saved=1");
}

export async function deactivateChecklistItem(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_items").update({ active: false }).eq("id", id);
  if (error) redirect(`/admin/checklists?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/checklists");
}
