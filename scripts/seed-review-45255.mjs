#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...parts] = line.split("=");
    if (!process.env[key]) process.env[key] = parts.join("=").replace(/^['\"]|['\"]$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const password = process.env.REVIEW_SEED_PASSWORD ?? "ReviewDemo123!";
const seedEmailDomain = "review.jjllawn.local";
const seedTag = "review-45255";
const today = new Date();
const isoDate = (offsetDays) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

const users = [
  { key: "admin", name: "Riley Review Admin", email: `admin@${seedEmailDomain}`, role: "admin", phone: "513-555-0100", active: true },
  { key: "crew1", name: "Jayden Crew", email: `jayden@${seedEmailDomain}`, role: "crew", phone: "513-555-0101", active: true },
  { key: "crew2", name: "Jacob Crew", email: `jacob@${seedEmailDomain}`, role: "crew", phone: "513-555-0102", active: true },
  { key: "crew3", name: "Liam Crew", email: `liam@${seedEmailDomain}`, role: "crew", phone: "513-555-0103", active: true },
  { key: "banned", name: "Banned Review User", email: `banned@${seedEmailDomain}`, role: "customer", phone: "513-555-0199", active: false },
];

const reviewCustomers = [
  {
    key: "towne-center",
    name: "Avery Thompson",
    email: `avery.thompson@${seedEmailDomain}`,
    phone: "513-555-1101",
    address: "7578 Beechmont Ave",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.07295,
    longitude: -84.34974,
    yardSize: "small",
    gateNotes: "Meet near the Towne Center side entrance; demo property marker only.",
    accessNotes: "Public commercial address used for review seed data, not a real residence.",
    hazardNotes: "High traffic near parking lot edge.",
    service: "Basic Cut",
    addOns: ["Edging"],
    requestStatus: "new",
    riskLevel: "low",
    jobStatus: "accepted",
    scheduleOffset: 1,
    start: "09:00",
    end: "10:00",
    total: 72,
    paid: 0,
    priority: 4,
  },
  {
    key: "kroger",
    name: "Morgan Ellis",
    email: `morgan.ellis@${seedEmailDomain}`,
    phone: "513-555-1102",
    address: "7580 Beechmont Ave",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.07335,
    longitude: -84.35048,
    yardSize: "medium",
    gateNotes: "Use side access by service drive.",
    accessNotes: "Commercial landmark address used for map-pin review.",
    hazardNotes: "Watch for curb stones and carts near turf edge.",
    service: "Clean Cut",
    addOns: ["Stick Pickup", "Debris Bagging"],
    requestStatus: "needs_review",
    riskLevel: "medium",
    jobStatus: "scheduled",
    scheduleOffset: 1,
    start: "10:30",
    end: "12:00",
    total: 128,
    paid: 0,
    priority: 8,
  },
  {
    key: "mcalisters",
    name: "Casey Rivera",
    email: `casey.rivera@${seedEmailDomain}`,
    phone: "513-555-1103",
    address: "7636 Beechmont Ave",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.0742,
    longitude: -84.34788,
    yardSize: "small",
    gateNotes: "Front beds only; avoid patio traffic.",
    accessNotes: "Public business address used only for demo seed routing.",
    hazardNotes: "Pedestrians and mulch beds near sidewalk.",
    service: "Yard Reset",
    addOns: ["Extra Weed Pulling", "Debris Bagging"],
    requestStatus: "site_review_needed",
    riskLevel: "medium",
    jobStatus: "on_the_way",
    scheduleOffset: 0,
    start: "13:00",
    end: "15:00",
    total: 185,
    paid: 0,
    priority: 10,
  },
  {
    key: "joint",
    name: "Jordan Brooks",
    email: `jordan.brooks@${seedEmailDomain}`,
    phone: "513-555-1104",
    address: "7625 Beechmont Ave Suite D",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.07388,
    longitude: -84.34879,
    yardSize: "small",
    gateNotes: "Narrow frontage strip by storefront.",
    accessNotes: "Use Beechmont frontage; public address for review seed only.",
    hazardNotes: "Busy curb cut; cones recommended.",
    service: "Basic Cut",
    addOns: ["Overgrown Grass Surcharge"],
    requestStatus: "estimate_sent",
    riskLevel: "low",
    jobStatus: "in_progress",
    scheduleOffset: 0,
    start: "15:30",
    end: "16:30",
    total: 95,
    paid: 0,
    priority: 9,
  },
  {
    key: "pub-grill",
    name: "Taylor Nguyen",
    email: `taylor.nguyen@${seedEmailDomain}`,
    phone: "513-555-1105",
    address: "8060 Beechmont Ave",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.07102,
    longitude: -84.33072,
    yardSize: "medium",
    gateNotes: "Back grass strip near dumpster enclosure.",
    accessNotes: "Coordinate around lunch rush; public business address for demo.",
    hazardNotes: "Grease-trap cover and uneven gravel near rear strip.",
    service: "Clean Cut",
    addOns: ["Edging", "Stick Pickup"],
    requestStatus: "converted_to_job",
    riskLevel: "medium",
    jobStatus: "completed_unpaid",
    scheduleOffset: -1,
    start: "11:00",
    end: "12:30",
    total: 142,
    paid: 0,
    priority: 6,
  },
  {
    key: "anderson-high",
    name: "Sam Patel",
    email: `sam.patel@${seedEmailDomain}`,
    phone: "513-555-1106",
    address: "7560 Forest Rd",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.06861,
    longitude: -84.33584,
    yardSize: "large",
    gateNotes: "Open field edge; no fenced gate.",
    accessNotes: "School/public address used as review seed map marker.",
    hazardNotes: "Large area; avoid athletic equipment and wet field edges.",
    service: "Mulch Refresh",
    addOns: ["Extra Weed Pulling", "Debris Bagging"],
    requestStatus: "archived",
    riskLevel: "low",
    jobStatus: "paid",
    scheduleOffset: -4,
    start: "09:30",
    end: "12:00",
    total: 275,
    paid: 275,
    priority: 2,
  },
  {
    key: "veterans-park",
    name: "Drew Williams",
    email: `drew.williams@${seedEmailDomain}`,
    phone: "513-555-1107",
    address: "8531 Forest Rd",
    city: "Cincinnati",
    state: "OH",
    zip: "45255",
    latitude: 39.07554,
    longitude: -84.31386,
    yardSize: "extra_large",
    gateNotes: "Park drive access; keep equipment ground-level only.",
    accessNotes: "Public park address used for demo routing and map pins.",
    hazardNotes: "Large public area; parent/admin approval required before pressure-wash or large cleanup scope.",
    service: "Yard Reset",
    addOns: ["Dog Waste Cleanup", "Debris Bagging"],
    requestStatus: "needs_more_info",
    riskLevel: "high",
    jobStatus: "completed",
    scheduleOffset: -2,
    start: "14:00",
    end: "16:30",
    total: 235,
    paid: 100,
    priority: 5,
  },
];

async function listAuthUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

async function cleanup() {
  console.log("Cleaning previous 45255 review seed data...");
  const { data: seedCustomers } = await supabase.from("customers").select("id").ilike("email", `%@${seedEmailDomain}`);
  const customerIds = (seedCustomers ?? []).map((row) => row.id);
  const { data: seedProfiles } = await supabase.from("profiles").select("id, auth_user_id").ilike("email", `%@${seedEmailDomain}`);
  const profileIds = (seedProfiles ?? []).map((row) => row.id);
  if (profileIds.length) await supabase.from("activity_log").delete().in("actor_id", profileIds);
  await supabase.from("activity_log").delete().eq("metadata_json->>seed", seedTag);

  const { data: seedMedia } = await supabase.from("media_files").select("id, file_url").ilike("file_url", `%${seedTag}%`);
  const mediaPaths = (seedMedia ?? []).map((file) => file.file_url);
  if (seedMedia?.length) await supabase.from("media_files").delete().in("id", seedMedia.map((file) => file.id));
  for (const bucket of ["quote-photos", "job-photos", "receipts", "payment-proofs"]) {
    const paths = mediaPaths.filter((path) => path.includes(seedTag));
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }

  if (customerIds.length) await supabase.from("customers").delete().in("id", customerIds);
  await supabase.from("expenses").delete().ilike("notes", `%${seedTag}%`);
  if (profileIds.length) await supabase.from("crew_availability").delete().in("profile_id", profileIds);
  if (profileIds.length) await supabase.from("profiles").delete().in("id", profileIds);

  const authUsers = await listAuthUsers();
  for (const user of authUsers.filter((user) => user.email?.endsWith(`@${seedEmailDomain}`))) {
    await supabase.auth.admin.deleteUser(user.id);
  }
}

async function ensureAuthProfile({ name, email, phone, role, active }) {
  const authUsers = await listAuthUsers();
  const existing = authUsers.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  const authUser = existing
    ? (await supabase.auth.admin.updateUserById(existing.id, { email, password, user_metadata: { name }, ban_duration: active ? "none" : "876000h" })).data.user
    : (await supabase.auth.admin.createUser({ email, password, email_confirm: true, phone: undefined, user_metadata: { name }, ban_duration: active ? "none" : "876000h" })).data.user;
  if (!authUser) throw new Error(`Could not create auth user ${email}`);

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("auth_user_id", authUser.id).maybeSingle();
  const payload = { auth_user_id: authUser.id, name, email, phone, role, active };
  if (existingProfile) {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", existingProfile.id).select("id").single();
    if (error) throw error;
    return { id: data.id, authUserId: authUser.id };
  }
  const { data, error } = await supabase.from("profiles").insert(payload).select("id").single();
  if (error) throw error;
  return { id: data.id, authUserId: authUser.id };
}

async function uploadPng(bucket, path) {
  const { error } = await supabase.storage.from(bucket).upload(path, transparentPng, { contentType: "image/png", upsert: true });
  if (error) throw error;
}

function checklist(status) {
  const done = ["completed", "completed_unpaid", "paid"].includes(status);
  const partial = ["in_progress", "completed"].includes(status);
  return [
    { label: "Yard checked for objects", required: true, completed: done || partial, completed_at: done || partial ? new Date().toISOString() : null },
    { label: "Before photos taken", required: true, completed: done || partial, completed_at: done || partial ? new Date().toISOString() : null },
    { label: "Service completed", required: true, completed: done, completed_at: done ? new Date().toISOString() : null },
    { label: "After photos taken", required: true, completed: done, completed_at: done ? new Date().toISOString() : null },
  ];
}

async function main() {
  await cleanup();

  console.log("Creating review users and access rights...");
  const profiles = new Map();
  for (const user of users) profiles.set(user.key, await ensureAuthProfile(user));
  for (const customer of reviewCustomers) {
    profiles.set(customer.key, await ensureAuthProfile({ name: customer.name, email: customer.email, phone: customer.phone, role: "customer", active: true }));
  }

  const crewIds = [profiles.get("crew1").id, profiles.get("crew2").id, profiles.get("crew3").id];
  for (const crewId of crewIds) {
    for (const offset of [-1, 0, 1, 2, 3]) {
      await supabase.from("crew_availability").insert({ profile_id: crewId, available_date: isoDate(offset), start_time: "08:00", end_time: "17:00", max_hours: 6, notes: `${seedTag} seeded availability`, active: true });
    }
  }

  const { data: serviceRows, error: servicesError } = await supabase.from("services").select("id, name, base_price, min_price, max_price, estimated_duration_minutes, default_crew_size");
  if (servicesError) throw servicesError;
  const serviceByName = new Map((serviceRows ?? []).map((service) => [service.name, service]));
  const basicCut = serviceByName.get("Basic Cut");
  const cleanCut = serviceByName.get("Clean Cut");
  const terms = (await supabase.from("terms_versions").select("id").eq("active", true).limit(1).maybeSingle()).data;

  const { data: questionRows } = await supabase.from("service_questions").select("id, service_id, question_text, service_question_options(id, label)").eq("active", true);

  console.log("Creating 7 Anderson/45255 review customers, properties, requests, estimates, jobs, photos, and accounting rows...");
  for (let index = 0; index < reviewCustomers.length; index += 1) {
    const item = reviewCustomers[index];
    const profile = profiles.get(item.key);
    const service = serviceByName.get(item.service) ?? basicCut ?? cleanCut;
    if (!service) throw new Error(`Missing service for ${item.service}`);
    const addOnRows = item.addOns.map((name) => serviceByName.get(name)).filter(Boolean);

    const { data: customer, error: customerError } = await supabase.from("customers").insert({
      profile_id: profile.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      notes: `${seedTag}: Fake customer account using a public Anderson/45255 landmark address for platform review.`,
      status: "active",
    }).select("id").single();
    if (customerError) throw customerError;

    const { data: property, error: propertyError } = await supabase.from("properties").insert({
      customer_id: customer.id,
      address_line_1: item.address,
      city: item.city,
      state: item.state,
      zip: item.zip,
      latitude: item.latitude,
      longitude: item.longitude,
      gate_notes: item.gateNotes,
      pet_notes: "No pets reported for review seed.",
      hazard_notes: item.hazardNotes,
      yard_size: item.yardSize,
      access_notes: item.accessNotes,
      active: true,
    }).select("id").single();
    if (propertyError) throw propertyError;

    const { data: request, error: requestError } = await supabase.from("quote_requests").insert({
      customer_id: customer.id,
      property_id: property.id,
      requested_service_id: service.id,
      status: item.requestStatus,
      yard_size: item.yardSize,
      grass_height: index % 2 === 0 ? "six_inches_or_less" : "over_six_inches",
      debris_present: item.addOns.includes("Debris Bagging"),
      dog_waste_present: item.addOns.includes("Dog Waste Cleanup"),
      pets_present: false,
      gate_access: item.gateNotes,
      preferred_dates: `${isoDate(item.scheduleOffset)} around ${item.start}`,
      customer_notes: `${seedTag}: Demo request for ${item.service} plus ${item.addOns.join(", ") || "no add-ons"}.`,
      internal_notes: `${seedTag}: Review record seeded for admin request detail, estimate creation, and map workflows.`,
      risk_level: item.riskLevel,
      parent_approval_required: item.riskLevel === "high" || item.total >= 225,
      parent_approved_at: item.riskLevel === "high" ? new Date().toISOString() : null,
      parent_approved_by: item.riskLevel === "high" ? profiles.get("admin").id : null,
      terms_accepted_at: new Date().toISOString(),
    }).select("id").single();
    if (requestError) throw requestError;

    const selectedServices = [service, ...addOnRows];
    for (let sort = 0; sort < selectedServices.length; sort += 1) {
      const selected = selectedServices[sort];
      const { data: requestService, error: qrsError } = await supabase.from("quote_request_services").insert({
        quote_request_id: request.id,
        service_id: selected.id,
        notes: `${seedTag}: ${sort === 0 ? "Primary scope" : "Add-on scope"} for ${selected.name}.`,
        estimated_duration_minutes: selected.estimated_duration_minutes ?? (sort === 0 ? 60 : 20),
        estimated_price_min: selected.min_price ?? selected.base_price ?? 15,
        estimated_price_max: selected.max_price ?? selected.base_price ?? item.total,
        sort_order: sort * 10,
      }).select("id").single();
      if (qrsError) throw qrsError;

      const serviceQuestions = (questionRows ?? []).filter((question) => question.service_id === selected.id).slice(0, 2);
      if (serviceQuestions.length) {
        for (const question of serviceQuestions) {
          const options = Array.isArray(question.service_question_options) ? question.service_question_options : [];
          const option = options[index % Math.max(options.length, 1)];
          await supabase.from("quote_request_service_answers").insert({
            quote_request_service_id: requestService.id,
            question_id: question.id,
            option_id: option?.id ?? null,
            answer_text: option?.label ?? `${seedTag}: seeded answer`,
          });
        }
      } else {
        await supabase.from("quote_request_service_answers").insert({ quote_request_service_id: requestService.id, answer_text: `${seedTag}: seeded service answer for ${selected.name}` });
      }

      if (sort === 0) {
        const quotePhotoPath = `${request.id}/${seedTag}-quote-${index + 1}.png`;
        await uploadPng("quote-photos", quotePhotoPath);
        const { data: media } = await supabase.from("media_files").insert({
          related_type: "quote_request",
          related_id: request.id,
          file_url: quotePhotoPath,
          file_type: "image/png",
          label: "photo",
          uploaded_by: profile.id,
        }).select("id").single();
        await supabase.from("quote_request_service_photos").insert({ quote_request_service_id: requestService.id, media_file_id: media.id });
      }
    }

    const documentNumber = `REV-EST-${String(index + 1).padStart(3, "0")}`;
    const invoiceNumber = `REV-INV-${String(index + 1).padStart(3, "0")}`;
    const estimateStatus = item.jobStatus === "accepted" ? "draft" : item.jobStatus === "scheduled" ? "sent" : "accepted";
    const { data: estimate, error: estimateError } = await supabase.from("documents").insert({
      document_type: "estimate",
      document_number: documentNumber,
      customer_id: customer.id,
      property_id: property.id,
      quote_request_id: request.id,
      status: estimateStatus,
      issue_date: isoDate(-2),
      expiration_date: isoDate(12),
      subtotal: item.total,
      total: item.total,
      balance_due: item.total,
      scope_included: `${item.service}; add-ons: ${item.addOns.join(", ") || "none"}.`,
      scope_excluded: "No ladder, roof, tree, chainsaw, chemical, or hazardous work.",
      customer_notes: `${seedTag}: Seeded estimate for platform review.`,
      internal_notes: `${seedTag}: Estimate connected to quote request and job map pin.`,
      terms_version_id: terms?.id ?? null,
      accepted_at: ["accepted", "scheduled", "on_the_way", "in_progress", "completed", "completed_unpaid", "paid"].includes(item.jobStatus) ? new Date().toISOString() : null,
      snapshot_json: { seed: seedTag, address: item.address },
    }).select("id").single();
    if (estimateError) throw estimateError;

    const lineDescriptions = [item.service, ...item.addOns];
    const baseLine = Math.round(item.total * 0.82 * 100) / 100;
    await supabase.from("document_items").insert([
      { document_id: estimate.id, service_id: service.id, item_type: "service", description: item.service, quantity: 1, unit_price: baseLine, line_total: baseLine, taxable: false, sort_order: 10 },
      ...addOnRows.map((addOn, addOnIndex) => ({ document_id: estimate.id, service_id: addOn.id, item_type: "add_on", description: addOn.name, quantity: 1, unit_price: Math.round(((item.total - baseLine) / Math.max(addOnRows.length, 1)) * 100) / 100, line_total: Math.round(((item.total - baseLine) / Math.max(addOnRows.length, 1)) * 100) / 100, taxable: false, sort_order: 20 + addOnIndex * 10 })),
    ]);

    const { data: job, error: jobError } = await supabase.from("jobs").insert({
      customer_id: customer.id,
      property_id: property.id,
      estimate_id: estimate.id,
      status: item.jobStatus,
      scheduled_date: isoDate(item.scheduleOffset),
      scheduled_start_time: item.start,
      scheduled_end_time: item.end,
      assigned_crew_ids: index % 3 === 0 ? [crewIds[0], crewIds[1]] : index % 3 === 1 ? [crewIds[1], crewIds[2]] : [crewIds[0], crewIds[2]],
      checklist_snapshot: checklist(item.jobStatus),
      tool_notes: `${seedTag}: mower, trimmer, blower, broom, bags, first-aid kit.`,
      safety_notes: item.hazardNotes,
      internal_notes: `${seedTag}: Seeded job for map/schedule/route review.`,
      customer_visible_notes: `Seeded demo job at ${item.address}.`,
      completed_at: ["completed", "completed_unpaid", "paid"].includes(item.jobStatus) ? new Date(new Date().setDate(today.getDate() + item.scheduleOffset)).toISOString() : null,
      estimated_duration_minutes: service.estimated_duration_minutes ?? 60,
      required_crew_size: service.default_crew_size ?? 2,
      earliest_start_time: "08:00",
      latest_end_time: "17:00",
      route_priority: item.priority,
    }).select("id").single();
    if (jobError) throw jobError;

    await supabase.from("documents").update({ job_id: job.id }).eq("id", estimate.id);

    const jobBeforePath = `${job.id}/before/${seedTag}-before-${index + 1}.png`;
    const jobAfterPath = `${job.id}/after/${seedTag}-after-${index + 1}.png`;
    await uploadPng("job-photos", jobBeforePath);
    await uploadPng("job-photos", jobAfterPath);
    await supabase.from("media_files").insert([
      { related_type: "job", related_id: job.id, file_url: jobBeforePath, file_type: "image/png", label: "before", uploaded_by: crewIds[index % crewIds.length] },
      { related_type: "job", related_id: job.id, file_url: jobAfterPath, file_type: "image/png", label: "after", uploaded_by: crewIds[index % crewIds.length] },
    ]);

    if (["completed", "completed_unpaid", "paid"].includes(item.jobStatus)) {
      const balanceDue = Math.max(item.total - item.paid, 0);
      const invoiceStatus = balanceDue <= 0 ? "paid" : item.paid > 0 ? "partially_paid" : "unpaid";
      const { data: invoice, error: invoiceError } = await supabase.from("documents").insert({
        document_type: "invoice",
        document_number: invoiceNumber,
        customer_id: customer.id,
        property_id: property.id,
        quote_request_id: request.id,
        job_id: job.id,
        status: invoiceStatus,
        issue_date: isoDate(item.scheduleOffset),
        due_date: isoDate(item.scheduleOffset),
        subtotal: item.total,
        total: item.total,
        amount_paid: item.paid,
        balance_due: balanceDue,
        scope_included: `${item.service}; add-ons: ${item.addOns.join(", ") || "none"}.`,
        payment_instructions: "Cash or Venmo due upon completion.",
        terms_version_id: terms?.id ?? null,
        snapshot_json: { seed: seedTag, sourceEstimate: estimate.id },
      }).select("id").single();
      if (invoiceError) throw invoiceError;
      await supabase.from("document_items").insert(lineDescriptions.map((description, lineIndex) => ({ document_id: invoice.id, service_id: lineIndex === 0 ? service.id : addOnRows[lineIndex - 1]?.id ?? null, item_type: lineIndex === 0 ? "service" : "add_on", description, quantity: 1, unit_price: Math.round((item.total / lineDescriptions.length) * 100) / 100, line_total: Math.round((item.total / lineDescriptions.length) * 100) / 100, taxable: false, sort_order: 10 + lineIndex * 10 })));
      await supabase.from("jobs").update({ invoice_id: invoice.id }).eq("id", job.id);
      if (item.paid > 0) {
        const { data: payment } = await supabase.from("payments").insert({ document_id: invoice.id, job_id: job.id, amount: item.paid, method: index % 2 ? "cash" : "venmo", status: balanceDue <= 0 ? "paid" : "partially_paid", confirmed_by: profiles.get("admin").id, received_at: new Date().toISOString(), notes: `${seedTag}: Seeded payment.` }).select("id").single();
        if (payment) {
          const paymentPath = `${payment.id}/${seedTag}-payment-${index + 1}.png`;
          await uploadPng("payment-proofs", paymentPath);
          await supabase.from("media_files").insert({ related_type: "payment", related_id: payment.id, file_url: paymentPath, file_type: "image/png", label: "payment", uploaded_by: profiles.get("admin").id });
        }
      }
    }

    const { data: expense } = await supabase.from("expenses").insert({ job_id: job.id, category: index % 2 ? "Fuel" : "Materials", amount: 8 + index * 3, paid_by: crewIds[index % crewIds.length], expense_date: isoDate(item.scheduleOffset), reimbursed: index % 2 === 0, notes: `${seedTag}: Seeded expense for earnings review.` }).select("id").single();
    if (expense) {
      const receiptPath = `${expense.id}/${seedTag}-receipt-${index + 1}.png`;
      await uploadPng("receipts", receiptPath);
      await supabase.from("media_files").insert({ related_type: "expense", related_id: expense.id, file_url: receiptPath, file_type: "image/png", label: "receipt", uploaded_by: crewIds[index % crewIds.length] });
    }

    if (terms?.id) {
      await supabase.from("terms_acceptances").insert({ customer_id: customer.id, property_id: property.id, quote_request_id: request.id, document_id: estimate.id, terms_version_id: terms.id, accepted_name: item.name, accepted_at: new Date().toISOString(), user_agent: `${seedTag} seed script` });
    }

    await supabase.from("activity_log").insert({ actor_id: profiles.get("admin").id, action: "review_seed_created", related_type: "job", related_id: job.id, metadata_json: { seed: seedTag, address: item.address, services: lineDescriptions } });
  }

  console.log("Review seed complete.");
  console.log(`Password for all ${seedEmailDomain} users: ${password}`);
  console.log("Suggested review accounts:");
  console.log(`  Admin: admin@${seedEmailDomain}`);
  console.log(`  Crew: jayden@${seedEmailDomain}`);
  console.log(`  Customer: avery.thompson@${seedEmailDomain}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
