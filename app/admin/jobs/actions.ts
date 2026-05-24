"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { defaultDocumentSettings, defaultPaymentSettings, mergeSettings } from "@/lib/settings/defaults";
import { formatDocumentNumber } from "@/lib/documents/numbering";

async function getSetting<T extends object>(key: string, defaults: T) {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value_json").eq("key", key).maybeSingle();
  return mergeSettings(defaults, data?.value_json);
}

async function buildChecklistSnapshotForService(serviceId: string | null) {
  const supabase = await createClient();
  let templateId: string | null = null;
  if (serviceId) {
    const { data: specific } = await supabase
      .from("checklist_templates")
      .select("id")
      .eq("service_id", serviceId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    templateId = specific?.id ?? null;
  }

  if (!templateId) {
    const { data: fallback } = await supabase
      .from("checklist_templates")
      .select("id")
      .eq("active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    templateId = fallback?.id ?? null;
  }

  if (!templateId) return [];
  const { data: items } = await supabase
    .from("checklist_items")
    .select("id, label, required, sort_order")
    .eq("checklist_template_id", templateId)
    .eq("active", true)
    .order("sort_order");

  return (items ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    required: item.required,
    completed: false,
  }));
}

async function buildChecklistSnapshot(estimateId: string) {
  const supabase = await createClient();
  const { data: firstItem } = await supabase
    .from("document_items")
    .select("service_id")
    .eq("document_id", estimateId)
    .not("service_id", "is", null)
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  return buildChecklistSnapshotForService(firstItem?.service_id ?? null);
}

export async function createAdminJob(formData: FormData) {
  await requireRole(["admin"]);
  const propertyId = String(formData.get("propertyId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "") || null;
  const assignedCrewIds = formData.getAll("assignedCrewIds").map(String).filter(Boolean);
  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("id, customer_id").eq("id", propertyId).maybeSingle();
  if (!property) redirect("/admin/jobs/new?error=Property not found");

  const checklist = await buildChecklistSnapshotForService(serviceId);
  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: property.customer_id,
      property_id: property.id,
      status: String(formData.get("status") ?? "scheduled"),
      scheduled_date: String(formData.get("scheduledDate") ?? "") || null,
      scheduled_start_time: String(formData.get("scheduledStartTime") ?? "") || null,
      scheduled_end_time: String(formData.get("scheduledEndTime") ?? "") || null,
      assigned_crew_ids: assignedCrewIds,
      checklist_snapshot: checklist,
      customer_visible_notes: String(formData.get("requestedWork") ?? ""),
      tool_notes: String(formData.get("toolNotes") ?? ""),
      safety_notes: String(formData.get("safetyNotes") ?? ""),
      internal_notes: `Admin-created direct job. Service id: ${serviceId ?? "none"}\n${String(formData.get("internalNotes") ?? "")}`,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/jobs/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/map");
  revalidatePath("/admin/dashboard");
  redirect(`/admin/jobs/${job.id}`);
}

export async function convertEstimateToJob(formData: FormData) {
  await requireRole(["admin"]);
  const estimateId = String(formData.get("estimateId") ?? "");
  const supabase = await createClient();
  const { data: estimate } = await supabase
    .from("documents")
    .select("id, status, customer_id, property_id")
    .eq("id", estimateId)
    .eq("document_type", "estimate")
    .maybeSingle();

  if (!estimate) redirect(`/admin/estimates/${estimateId}?error=Estimate not found`);
  if (estimate.status !== "accepted") redirect(`/admin/estimates/${estimateId}?error=Only accepted estimates can be converted to jobs`);

  const { data: existing } = await supabase.from("jobs").select("id").eq("estimate_id", estimate.id).maybeSingle();
  if (existing) redirect(`/admin/jobs/${existing.id}`);

  const checklist = await buildChecklistSnapshot(estimate.id);
  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: estimate.customer_id,
      property_id: estimate.property_id,
      estimate_id: estimate.id,
      status: "accepted",
      checklist_snapshot: checklist,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/estimates/${estimateId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("documents").update({ status: "converted", job_id: job.id }).eq("id", estimate.id);
  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${job.id}`);
}

export async function updateJobSchedule(formData: FormData) {
  await requireRole(["admin"]);
  const jobId = String(formData.get("jobId") ?? "");
  const assignedCrewIds = formData.getAll("assignedCrewIds").map(String).filter(Boolean);
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      status: String(formData.get("status") ?? "scheduled"),
      scheduled_date: String(formData.get("scheduledDate") ?? "") || null,
      scheduled_start_time: String(formData.get("scheduledStartTime") ?? "") || null,
      scheduled_end_time: String(formData.get("scheduledEndTime") ?? "") || null,
      assigned_crew_ids: assignedCrewIds,
      estimated_duration_minutes: Number(formData.get("estimatedDurationMinutes") || 60),
      required_crew_size: Number(formData.get("requiredCrewSize") || 1),
      earliest_start_time: String(formData.get("earliestStartTime") ?? "") || null,
      latest_end_time: String(formData.get("latestEndTime") ?? "") || null,
      route_priority: Number(formData.get("routePriority") || 0),
      tool_notes: String(formData.get("toolNotes") ?? ""),
      safety_notes: String(formData.get("safetyNotes") ?? ""),
      internal_notes: String(formData.get("internalNotes") ?? ""),
      customer_visible_notes: String(formData.get("customerVisibleNotes") ?? ""),
    })
    .eq("id", jobId);

  if (error) redirect(`/admin/jobs/${jobId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}?saved=1`);
}

export async function updateJobChecklist(formData: FormData) {
  await requireRole(["crew", "admin"]);
  const jobId = String(formData.get("jobId") ?? "");
  const completedIds = new Set(formData.getAll("completedItemIds").map(String));
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("checklist_snapshot").eq("id", jobId).maybeSingle();
  if (!job) redirect(`/crew/jobs/${jobId}?error=Job not found`);

  const snapshot = Array.isArray(job.checklist_snapshot) ? job.checklist_snapshot : [];
  const nextSnapshot = snapshot.map((item) => ({
    ...item,
    completed: completedIds.has(String(item.id)),
  }));

  await supabase.from("jobs").update({ checklist_snapshot: nextSnapshot }).eq("id", jobId);
  revalidatePath(`/crew/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function updateCrewJobStatus(formData: FormData) {
  await requireRole(["crew", "admin"]);
  const jobId = String(formData.get("jobId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = new Set(["on_the_way", "in_progress"]);
  if (!allowed.has(status)) redirect(`/crew/jobs/${jobId}?error=Invalid status`);
  const supabase = await createClient();
  await supabase.from("jobs").update({ status }).eq("id", jobId);
  revalidatePath(`/crew/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function markJobComplete(formData: FormData) {
  await requireRole(["crew", "admin"]);
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("checklist_snapshot").eq("id", jobId).maybeSingle();
  const snapshot = Array.isArray(job?.checklist_snapshot) ? job.checklist_snapshot : [];
  const missingRequired = snapshot.some((item) => item.required && !item.completed);
  if (missingRequired) redirect(`/crew/jobs/${jobId}?error=Complete required checklist items first`);

  await supabase.from("jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", jobId);
  revalidatePath(`/crew/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function uploadJobPhoto(formData: FormData) {
  const profile = await requireRole(["crew", "admin"]);
  const jobId = String(formData.get("jobId") ?? "");
  const label = String(formData.get("label") ?? "photo");
  const photos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  const supabase = await createClient();

  for (const photo of photos.slice(0, 6)) {
    if (!photo.type.startsWith("image/") || photo.size > 8 * 1024 * 1024) continue;
    const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${jobId}/${label}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("job-photos").upload(storagePath, photo, { contentType: photo.type });
    if (!error) {
      await supabase.from("media_files").insert({
        related_type: "job",
        related_id: jobId,
        file_url: storagePath,
        file_type: photo.type,
        label,
        uploaded_by: profile.id,
      });
    }
  }

  revalidatePath(`/crew/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}`);
}

async function nextDocumentNumber(documentType: "estimate" | "invoice", prefix: string, startingNumber: number) {
  const supabase = await createClient();
  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("document_type", documentType);
  return formatDocumentNumber(prefix, startingNumber + (count ?? 0));
}

export async function generateInvoiceForJob(formData: FormData) {
  await requireRole(["admin"]);
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, customer_id, property_id, estimate_id, invoice_id")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) redirect(`/admin/jobs/${jobId}?error=Job not found`);
  if (job.invoice_id) redirect(`/admin/invoices/${job.invoice_id}`);

  const [{ data: estimate }, { data: items }, documentSettings, paymentSettings] = await Promise.all([
    supabase.from("documents").select("*, snapshot_json").eq("id", job.estimate_id).maybeSingle(),
    supabase.from("document_items").select("*").eq("document_id", job.estimate_id).order("sort_order"),
    getSetting("document", defaultDocumentSettings),
    getSetting("payment_public", defaultPaymentSettings),
  ]);
  if (!estimate) redirect(`/admin/jobs/${jobId}?error=Estimate not found`);

  const documentNumber = await nextDocumentNumber("invoice", documentSettings.invoicePrefix, documentSettings.startingNumber);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + documentSettings.defaultInvoiceDueDays);
  const paymentInstructions = [
    paymentSettings.acceptCash ? paymentSettings.cashInstructions : null,
    paymentSettings.acceptVenmo && paymentSettings.venmoHandle ? `Venmo: ${paymentSettings.venmoHandle}` : null,
  ].filter(Boolean).join("\n");

  const { data: invoice, error } = await supabase
    .from("documents")
    .insert({
      document_type: "invoice",
      document_number: documentNumber,
      customer_id: job.customer_id,
      property_id: job.property_id,
      quote_request_id: estimate.quote_request_id,
      job_id: job.id,
      status: "unpaid",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      subtotal: estimate.subtotal,
      discount_total: estimate.discount_total,
      tax_total: estimate.tax_total,
      total: estimate.total,
      balance_due: estimate.total,
      scope_included: estimate.scope_included,
      scope_excluded: estimate.scope_excluded,
      customer_notes: estimate.customer_notes,
      payment_instructions: paymentInstructions,
      terms_version_id: estimate.terms_version_id,
      snapshot_json: { ...estimate.snapshot_json, paymentSettings, documentSettings },
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/jobs/${jobId}?error=${encodeURIComponent(error.message)}`);

  if (items?.length) {
    await supabase.from("document_items").insert(items.map((item) => ({
      document_id: invoice.id,
      service_id: item.service_id,
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity,
      unit_label: item.unit_label,
      unit_price: item.unit_price,
      line_total: item.line_total,
      taxable: item.taxable,
      sort_order: item.sort_order,
    })));
  }

  await supabase.from("jobs").update({ invoice_id: invoice.id, status: "completed_unpaid" }).eq("id", job.id);
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/invoices/${invoice.id}`);
}
