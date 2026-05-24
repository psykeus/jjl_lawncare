"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { calculateDocumentTotals, calculateLineTotal } from "@/lib/pricing/calculations";
import { defaultDocumentSettings, defaultTaxReserveSettings, mergeSettings } from "@/lib/settings/defaults";
import { createClient } from "@/lib/supabase/server";
import { formatDocumentNumber } from "@/lib/documents/numbering";

async function getSetting<T extends object>(key: string, defaults: T) {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value_json").eq("key", key).maybeSingle();
  return mergeSettings(defaults, data?.value_json);
}

async function nextDocumentNumber(documentType: "estimate" | "invoice", prefix: string, startingNumber: number) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("document_type", documentType);
  return formatDocumentNumber(prefix, startingNumber + (count ?? 0));
}

export async function createEstimateFromQuoteRequest(formData: FormData) {
  await requireRole(["admin"]);
  const quoteRequestId = String(formData.get("quoteRequestId") ?? "");
  const supabase = await createClient();

  const { data: request, error: requestError } = await supabase
    .from("quote_requests")
    .select("id, customer_id, property_id, risk_level, parent_approval_required, parent_approved_at")
    .eq("id", quoteRequestId)
    .maybeSingle();
  if (requestError || !request) redirect(`/admin/quote-requests/${quoteRequestId}?error=Request not found`);

  const [documentSettings, taxReserveSettings] = await Promise.all([
    getSetting("document", defaultDocumentSettings),
    getSetting("tax_reserve", defaultTaxReserveSettings),
  ]);
  const { data: terms } = await supabase
    .from("terms_versions")
    .select("id, version, title")
    .eq("active", true)
    .eq("required_for_estimate_acceptance", true)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const documentNumber = await nextDocumentNumber("estimate", documentSettings.estimatePrefix, documentSettings.startingNumber);
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + documentSettings.defaultEstimateExpirationDays);

  const { data: estimate, error } = await supabase
    .from("documents")
    .insert({
      document_type: "estimate",
      document_number: documentNumber,
      customer_id: request.customer_id,
      property_id: request.property_id,
      quote_request_id: request.id,
      status: "draft",
      expiration_date: expiration.toISOString().slice(0, 10),
      terms_version_id: terms?.id ?? null,
      snapshot_json: { documentSettings, taxReserveSettings, terms },
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/quote-requests/${quoteRequestId}?error=${encodeURIComponent(error.message)}`);

  const { data: requestServices } = await supabase
    .from("quote_request_services")
    .select("service_id, notes, estimated_price_min, estimated_price_max, sort_order, services(name, unit_label)")
    .eq("quote_request_id", request.id)
    .order("sort_order");

  const items = (requestServices ?? []).map((requestService) => {
    const service = Array.isArray(requestService.services) ? requestService.services[0] : requestService.services;
    const unitPrice = Number(requestService.estimated_price_min ?? requestService.estimated_price_max ?? 0);
    return {
      document_id: estimate.id,
      service_id: requestService.service_id,
      item_type: "service",
      description: [service?.name ?? "Requested service", requestService.notes].filter(Boolean).join(" — "),
      quantity: 1,
      unit_label: service?.unit_label ?? null,
      unit_price: unitPrice,
      line_total: unitPrice,
      taxable: true,
      sort_order: requestService.sort_order ?? 0,
    };
  }).filter((item) => item.description);

  if (items.length) {
    await supabase.from("document_items").insert(items);
    await recalculateDocument(estimate.id);
  }

  await supabase.from("quote_requests").update({ status: "estimate_drafted" }).eq("id", request.id);
  revalidatePath("/admin/estimates");
  redirect(`/admin/estimates/${estimate.id}`);
}

export async function addEstimateItem(formData: FormData) {
  await requireRole(["admin"]);
  const documentId = String(formData.get("documentId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "") || null;
  const itemType = String(formData.get("itemType") ?? "custom");
  const description = String(formData.get("description") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitPrice = Number(formData.get("unitPrice") ?? 0);
  const unitLabel = String(formData.get("unitLabel") ?? "") || null;
  const taxable = formData.get("taxable") === "on";

  if (!documentId || !description || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    redirect(`/admin/estimates/${documentId}?error=Invalid line item`);
  }

  const lineTotal = calculateLineTotal({ quantity, unitPrice, itemType: itemType as never, taxable });
  const supabase = await createClient();
  const { error } = await supabase.from("document_items").insert({
    document_id: documentId,
    service_id: serviceId,
    item_type: itemType,
    description,
    quantity,
    unit_label: unitLabel,
    unit_price: unitPrice,
    line_total: lineTotal,
    taxable,
  });
  if (error) redirect(`/admin/estimates/${documentId}?error=${encodeURIComponent(error.message)}`);

  await recalculateDocument(documentId);
  revalidatePath(`/admin/estimates/${documentId}`);
  redirect(`/admin/estimates/${documentId}`);
}

export async function updateEstimateDetails(formData: FormData) {
  await requireRole(["admin"]);
  const documentId = String(formData.get("documentId") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      scope_included: String(formData.get("scopeIncluded") ?? ""),
      scope_excluded: String(formData.get("scopeExcluded") ?? ""),
      customer_notes: String(formData.get("customerNotes") ?? ""),
      internal_notes: String(formData.get("internalNotes") ?? ""),
    })
    .eq("id", documentId);
  if (error) redirect(`/admin/estimates/${documentId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/estimates/${documentId}`);
  redirect(`/admin/estimates/${documentId}?saved=1`);
}

export async function sendEstimate(formData: FormData) {
  await requireRole(["admin"]);
  const documentId = String(formData.get("documentId") ?? "");
  const supabase = await createClient();
  const { data: estimate } = await supabase
    .from("documents")
    .select("id, total, scope_included, scope_excluded, quote_requests(parent_approval_required, parent_approved_at)")
    .eq("id", documentId)
    .maybeSingle();

  if (!estimate) redirect(`/admin/estimates/${documentId}?error=Estimate not found`);
  if (Number(estimate.total) <= 0) redirect(`/admin/estimates/${documentId}?error=Estimate total must be greater than zero`);
  if (!estimate.scope_included || !estimate.scope_excluded) redirect(`/admin/estimates/${documentId}?error=Scope included and excluded are required`);

  const request = Array.isArray(estimate.quote_requests) ? estimate.quote_requests[0] : estimate.quote_requests;
  if (request?.parent_approval_required && !request.parent_approved_at) {
    redirect(`/admin/estimates/${documentId}?error=Parent approval is required before sending this estimate`);
  }

  const { error } = await supabase.from("documents").update({ status: "sent", issue_date: new Date().toISOString().slice(0, 10) }).eq("id", documentId);
  if (error) redirect(`/admin/estimates/${documentId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("quote_requests").update({ status: "estimate_sent" }).eq("id", String(formData.get("quoteRequestId") ?? ""));
  revalidatePath("/admin/estimates");
  redirect(`/admin/estimates/${documentId}?sent=1`);
}

async function recalculateDocument(documentId: string) {
  const supabase = await createClient();
  const [{ data: document }, { data: items }] = await Promise.all([
    supabase.from("documents").select("amount_paid, snapshot_json").eq("id", documentId).maybeSingle(),
    supabase.from("document_items").select("quantity, unit_price, taxable, item_type").eq("document_id", documentId),
  ]);

  const snapshot = document?.snapshot_json as { taxReserveSettings?: { salesTaxEnabled?: boolean; salesTaxRate?: number } } | null;
  const tax = snapshot?.taxReserveSettings ?? defaultTaxReserveSettings;
  const totals = calculateDocumentTotals({
    items: (items ?? []).map((item) => ({
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      taxable: Boolean(item.taxable),
      itemType: item.item_type as never,
    })),
    taxEnabled: Boolean(tax.salesTaxEnabled),
    taxRate: Number(tax.salesTaxRate ?? 0),
  });

  const amountPaid = Number(document?.amount_paid ?? 0);
  await supabase.from("documents").update({
    subtotal: totals.subtotal,
    discount_total: totals.discountTotal,
    tax_total: totals.taxTotal,
    total: totals.total,
    balance_due: totals.total - amountPaid,
  }).eq("id", documentId);
}
