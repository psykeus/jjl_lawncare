"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/maps/geocode";
import { checkServiceArea } from "@/lib/service-area/check";
import { quoteRequestSchema } from "@/lib/validations/quote-request";

const selectedAnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).optional().default([]),
  answerText: z.string().trim().optional().default(""),
});

const selectedServiceSchema = z.object({
  serviceId: z.string().uuid(),
  notes: z.string().trim().optional().default(""),
  sortOrder: z.coerce.number().int().optional().default(0),
  answers: z.array(selectedAnswerSchema).optional().default([]),
});

type ServiceRow = {
  id: string;
  name: string;
  service_type: string;
  base_price: number | string | null;
  min_price: number | string | null;
  max_price: number | string | null;
  requires_parent_approval: boolean | null;
  requires_photos: boolean | null;
  estimated_duration_minutes: number | string | null;
  default_crew_size: number | string | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  label: string;
  price_modifier: number | string | null;
  duration_modifier_minutes: number | null;
  risk_modifier: string | null;
  requires_parent_approval: boolean | null;
};

function parseSelectedServices(value: FormDataEntryValue | null) {
  try {
    const parsed = z.array(selectedServiceSchema).min(1, "Choose at least one service").safeParse(JSON.parse(String(value ?? "[]")));
    if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Choose at least one service" };
    return { data: parsed.data, error: null };
  } catch {
    return { data: null, error: "Choose at least one service" };
  }
}

function numberOrNull(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeSelectedServices(selected: z.infer<typeof selectedServiceSchema>[], servicesById: Map<string, ServiceRow>, optionsById: Map<string, OptionRow>) {
  return selected.map((item) => {
    const service = servicesById.get(item.serviceId);
    const answerText = item.answers.flatMap((answer) => {
      const labels = answer.optionIds.map((id) => optionsById.get(id)?.label).filter(Boolean);
      return [...labels, answer.answerText].filter(Boolean);
    });
    const parts = [`Service: ${service?.name ?? "Selected service"}`];
    if (answerText.length) parts.push(`Answers: ${answerText.join(", ")}`);
    if (item.notes) parts.push(`Notes: ${item.notes}`);
    return parts.join("\n");
  }).join("\n\n");
}

function highestRisk(current: "low" | "medium" | "high", candidate: string | null | undefined): "low" | "medium" | "high" {
  const order = { low: 1, medium: 2, high: 3 };
  if (candidate !== "medium" && candidate !== "high") return current;
  return order[candidate] > order[current] ? candidate : current;
}

async function uploadQuotePhoto({ supabase, requestId, serviceRequestId, photo }: { supabase: ReturnType<typeof createAdminClient>; requestId: string; serviceRequestId?: string; photo: File }) {
  if (!photo.type.startsWith("image/")) return null;
  if (photo.size > 8 * 1024 * 1024) return null;

  const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = serviceRequestId ? `${requestId}/${serviceRequestId}/${randomUUID()}.${extension}` : `${requestId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("quote-photos")
    .upload(storagePath, photo, { contentType: photo.type, upsert: false });

  if (uploadError) return null;

  const { data: media } = await supabase.from("media_files").insert({
    related_type: "quote_request",
    related_id: requestId,
    file_url: storagePath,
    file_type: photo.type,
    label: "photo",
  }).select("id").single();

  return media?.id ?? null;
}

export async function submitQuoteRequest(formData: FormData) {
  const selectedResult = parseSelectedServices(formData.get("selectedServicesJson"));
  if (!selectedResult.data) redirect(`/request-quote?error=${encodeURIComponent(selectedResult.error ?? "Choose at least one service")}`);
  const selectedServices = selectedResult.data;

  const parsed = quoteRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    requestedServiceId: selectedServices[0]?.serviceId ?? formData.get("requestedServiceId"),
    yardSize: formData.get("yardSize"),
    grassHeight: formData.get("grassHeight"),
    debrisPresent: formData.get("debrisPresent") === "on",
    dogWastePresent: formData.get("dogWastePresent") === "on",
    petsPresent: formData.get("petsPresent") === "on",
    gateAccess: formData.get("gateAccess"),
    preferredDates: formData.get("preferredDates"),
    customerNotes: formData.get("customerNotes"),
    acceptedName: formData.get("acceptedName"),
    termsAccepted: formData.get("termsAccepted"),
  });

  if (!parsed.success) {
    redirect(`/request-quote?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid request")}`);
  }

  const input = parsed.data;
  const supabase = createAdminClient();
  const serviceIds = Array.from(new Set(selectedServices.map((item) => item.serviceId)));
  const answerOptionIds = Array.from(new Set(selectedServices.flatMap((item) => item.answers.flatMap((answer) => answer.optionIds))));

  const [{ data: services }, { data: options }] = await Promise.all([
    supabase.from("services").select("id, name, service_type, base_price, min_price, max_price, requires_parent_approval, requires_photos, estimated_duration_minutes, default_crew_size").in("id", serviceIds),
    answerOptionIds.length ? supabase.from("service_question_options").select("id, question_id, label, price_modifier, duration_modifier_minutes, risk_modifier, requires_parent_approval").in("id", answerOptionIds) : Promise.resolve({ data: [] as OptionRow[] }),
  ]);

  const servicesById = new Map<string, ServiceRow>(((services ?? []) as ServiceRow[]).map((service) => [service.id, service]));
  const optionsById = new Map<string, OptionRow>(((options ?? []) as OptionRow[]).map((option) => [option.id, option]));
  if (serviceIds.some((id) => !servicesById.has(id))) redirect(`/request-quote?error=${encodeURIComponent("One selected service is no longer available. Please choose again.")}`);

  const fullAddress = `${input.addressLine1}, ${input.city}, ${input.state} ${input.zip}`;
  const geocodedCoordinates = input.latitude != null && input.longitude != null ? { latitude: input.latitude, longitude: input.longitude } : await geocodeAddress(fullAddress);
  const areaCheck = await checkServiceArea({
    latitude: geocodedCoordinates?.latitude ?? null,
    longitude: geocodedCoordinates?.longitude ?? null,
    city: input.city,
    zip: input.zip,
  });
  if (!areaCheck.inside) redirect(`/request-quote?error=${encodeURIComponent(areaCheck.message)}`);

  const servicePhotos = selectedServices.flatMap((item) => formData.getAll(`servicePhotos:${item.serviceId}`).filter((value): value is File => value instanceof File && value.size > 0));
  const legacyPhotos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  if (![...servicePhotos, ...legacyPhotos].length) redirect(`/request-quote?error=${encodeURIComponent("Please upload at least one yard photo.")}`);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({ name: input.name, email: input.email, phone: input.phone, status: "new" })
    .select("id")
    .single();
  if (customerError) redirect(`/request-quote?error=${encodeURIComponent(customerError.message)}`);

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .insert({
      customer_id: customer.id,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2 || null,
      city: input.city,
      state: input.state.toUpperCase(),
      zip: input.zip,
      latitude: geocodedCoordinates?.latitude ?? null,
      longitude: geocodedCoordinates?.longitude ?? null,
      gate_notes: input.gateAccess || null,
      yard_size: input.yardSize || null,
      active: true,
    })
    .select("id")
    .single();
  if (propertyError) redirect(`/request-quote?error=${encodeURIComponent(propertyError.message)}`);

  let riskLevel: "low" | "medium" | "high" = input.dogWastePresent ? "medium" : "low";
  let parentApprovalRequired = input.dogWastePresent === true;
  for (const selected of selectedServices) {
    const service = servicesById.get(selected.serviceId);
    if (service?.requires_parent_approval) parentApprovalRequired = true;
    for (const optionId of selected.answers.flatMap((answer) => answer.optionIds)) {
      const option = optionsById.get(optionId);
      if (option?.requires_parent_approval) parentApprovalRequired = true;
      riskLevel = highestRisk(riskLevel, option?.risk_modifier);
    }
  }

  const serviceSummary = summarizeSelectedServices(selectedServices, servicesById, optionsById);
  const combinedNotes = [input.customerNotes, serviceSummary].filter(Boolean).join("\n\n");
  const firstSelected = selectedServices[0];

  const { data: request, error: requestError } = await supabase
    .from("quote_requests")
    .insert({
      customer_id: customer.id,
      property_id: property.id,
      requested_service_id: firstSelected?.serviceId || null,
      status: "new",
      yard_size: input.yardSize || null,
      grass_height: input.grassHeight || null,
      debris_present: input.debrisPresent ?? false,
      dog_waste_present: input.dogWastePresent ?? false,
      pets_present: input.petsPresent ?? false,
      gate_access: input.gateAccess || null,
      preferred_dates: input.preferredDates || null,
      customer_notes: combinedNotes || null,
      risk_level: riskLevel,
      parent_approval_required: parentApprovalRequired,
      terms_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (requestError) redirect(`/request-quote?error=${encodeURIComponent(requestError.message)}`);

  const createdRequestServices = new Map<string, string>();
  for (const selected of selectedServices) {
    const service = servicesById.get(selected.serviceId);
    const selectedOptions = selected.answers.flatMap((answer) => answer.optionIds.map((optionId) => optionsById.get(optionId)).filter((option): option is OptionRow => Boolean(option)));
    const modifierTotal = selectedOptions.reduce((sum, option) => sum + Number(option.price_modifier ?? 0), 0);
    const durationTotal = Number(service?.estimated_duration_minutes ?? 0) + selectedOptions.reduce((sum, option) => sum + Number(option.duration_modifier_minutes ?? 0), 0);
    const base = numberOrNull(service?.base_price);
    const min = numberOrNull(service?.min_price) ?? base;
    const max = numberOrNull(service?.max_price) ?? base ?? min;

    const { data: requestService, error: requestServiceError } = await supabase.from("quote_request_services").insert({
      quote_request_id: request.id,
      service_id: selected.serviceId,
      notes: selected.notes || null,
      estimated_duration_minutes: durationTotal || null,
      estimated_price_min: min != null ? Math.max(0, min + modifierTotal) : null,
      estimated_price_max: max != null ? Math.max(0, max + modifierTotal) : null,
      sort_order: selected.sortOrder,
    }).select("id").single();

    if (requestServiceError || !requestService) continue;
    createdRequestServices.set(selected.serviceId, requestService.id);

    const answersToInsert: Array<{ quote_request_service_id: string; question_id: string; option_id: string | null; answer_text: string | null }> = [];
    for (const answer of selected.answers) {
      if (answer.optionIds.length) {
        answersToInsert.push(...answer.optionIds.map((optionId) => ({
          quote_request_service_id: requestService.id,
          question_id: answer.questionId,
          option_id: optionId,
          answer_text: null,
        })));
      } else if (answer.answerText) {
        answersToInsert.push({ quote_request_service_id: requestService.id, question_id: answer.questionId, option_id: null, answer_text: answer.answerText });
      }
    }
    if (answersToInsert.length) await supabase.from("quote_request_service_answers").insert(answersToInsert);
  }

  for (const selected of selectedServices) {
    const requestServiceId = createdRequestServices.get(selected.serviceId);
    const photos = formData.getAll(`servicePhotos:${selected.serviceId}`).filter((value): value is File => value instanceof File && value.size > 0).slice(0, 6);
    for (const photo of photos) {
      const mediaId = await uploadQuotePhoto({ supabase, requestId: request.id, serviceRequestId: requestServiceId, photo });
      if (mediaId && requestServiceId) {
        await supabase.from("quote_request_service_photos").insert({ quote_request_service_id: requestServiceId, media_file_id: mediaId });
      }
    }
  }

  for (const photo of legacyPhotos.slice(0, 6)) {
    await uploadQuotePhoto({ supabase, requestId: request.id, photo });
  }

  const { data: terms } = await supabase
    .from("terms_versions")
    .select("id")
    .eq("active", true)
    .eq("required_for_quote_request", true)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (terms) {
    await supabase.from("terms_acceptances").insert({
      customer_id: customer.id,
      property_id: property.id,
      quote_request_id: request.id,
      terms_version_id: terms.id,
      accepted_name: input.acceptedName,
      accepted_at: new Date().toISOString(),
    });
  }

  await supabase.from("activity_log").insert({
    action: "quote_request.created",
    related_type: "quote_request",
    related_id: request.id,
    metadata_json: { source: "public_service_wizard", serviceIds, serviceArea: areaCheck.matchedAreaName },
  });

  redirect("/request-quote?submitted=1");
}
