"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/maps/geocode";
import { quoteRequestSchema } from "@/lib/validations/quote-request";

export async function submitQuoteRequest(formData: FormData) {
  const parsed = quoteRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    requestedServiceId: formData.get("requestedServiceId"),
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
  const fullAddress = `${input.addressLine1}, ${input.city}, ${input.state} ${input.zip}`;
  const coordinates = await geocodeAddress(fullAddress);

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
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      gate_notes: input.gateAccess || null,
      yard_size: input.yardSize || null,
      active: true,
    })
    .select("id")
    .single();
  if (propertyError) redirect(`/request-quote?error=${encodeURIComponent(propertyError.message)}`);

  const riskLevel = input.dogWastePresent ? "medium" : "low";
  const parentApprovalRequired = input.dogWastePresent === true;

  const { data: request, error: requestError } = await supabase
    .from("quote_requests")
    .insert({
      customer_id: customer.id,
      property_id: property.id,
      requested_service_id: input.requestedServiceId || null,
      status: "new",
      yard_size: input.yardSize || null,
      grass_height: input.grassHeight || null,
      debris_present: input.debrisPresent ?? false,
      dog_waste_present: input.dogWastePresent ?? false,
      pets_present: input.petsPresent ?? false,
      gate_access: input.gateAccess || null,
      preferred_dates: input.preferredDates || null,
      customer_notes: input.customerNotes || null,
      risk_level: riskLevel,
      parent_approval_required: parentApprovalRequired,
      terms_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (requestError) redirect(`/request-quote?error=${encodeURIComponent(requestError.message)}`);

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

  const photos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  for (const photo of photos.slice(0, 6)) {
    if (!photo.type.startsWith("image/")) continue;
    if (photo.size > 8 * 1024 * 1024) continue;

    const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const storagePath = `${request.id}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("quote-photos")
      .upload(storagePath, photo, { contentType: photo.type, upsert: false });

    if (!uploadError) {
      await supabase.from("media_files").insert({
        related_type: "quote_request",
        related_id: request.id,
        file_url: storagePath,
        file_type: photo.type,
        label: "photo",
      });
    }
  }

  await supabase.from("activity_log").insert({
    action: "quote_request.created",
    related_type: "quote_request",
    related_id: request.id,
    metadata_json: { source: "public_form" },
  });

  redirect("/request-quote?submitted=1");
}
