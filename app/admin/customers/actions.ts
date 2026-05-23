"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { geocodeAddress } from "@/lib/maps/geocode";
import { createAdminClient } from "@/lib/supabase/admin";

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

const customerSchema = z.object({
  name: z.string().trim().min(2, "Customer name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  createAccount: checkbox,
  password: z.string().optional().default(""),
  addressLine1: z.string().trim().min(3, "Street address is required"),
  addressLine2: z.string().trim().optional().default(""),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  zip: z.string().trim().min(5, "ZIP is required"),
  gateNotes: z.string().trim().optional().default(""),
  petNotes: z.string().trim().optional().default(""),
  hazardNotes: z.string().trim().optional().default(""),
  yardSize: z.string().trim().optional().default(""),
  accessNotes: z.string().trim().optional().default(""),
});

async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return null;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
}

export async function createCustomerAndProperty(formData: FormData) {
  await requireRole(["admin"]);
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    createAccount: formData.get("createAccount"),
    password: formData.get("password"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    gateNotes: formData.get("gateNotes"),
    petNotes: formData.get("petNotes"),
    hazardNotes: formData.get("hazardNotes"),
    yardSize: formData.get("yardSize"),
    accessNotes: formData.get("accessNotes"),
  });
  if (!parsed.success) redirect(`/admin/customers?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid customer")}`);
  const input = parsed.data;
  const supabase = createAdminClient();

  let profileId: string | null = null;
  if (input.createAccount) {
    const existingUser = await findAuthUserByEmail(input.email);
    const authUser = existingUser ?? (await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password || `JJL-${randomUUID().slice(0, 12)}!`,
      email_confirm: true,
      user_metadata: { name: input.name },
    })).data.user;

    if (authUser) {
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("auth_user_id", authUser.id).maybeSingle();
      if (existingProfile) {
        profileId = existingProfile.id;
        await supabase.from("profiles").update({ name: input.name, email: input.email, phone: input.phone || null, role: "customer", active: true }).eq("id", profileId);
      } else {
        const { data: profile } = await supabase.from("profiles").insert({ auth_user_id: authUser.id, name: input.name, email: input.email, phone: input.phone || null, role: "customer", active: true }).select("id").single();
        profileId = profile?.id ?? null;
      }
    }
  }

  const { data: customer, error: customerError } = await supabase.from("customers").insert({
    profile_id: profileId,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    notes: input.notes || null,
    status: "active",
  }).select("id").single();
  if (customerError) redirect(`/admin/customers?error=${encodeURIComponent(customerError.message)}`);

  const coordinates = await geocodeAddress(`${input.addressLine1}, ${input.city}, ${input.state} ${input.zip}`);
  const { error: propertyError } = await supabase.from("properties").insert({
    customer_id: customer.id,
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2 || null,
    city: input.city,
    state: input.state.toUpperCase(),
    zip: input.zip,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    gate_notes: input.gateNotes || null,
    pet_notes: input.petNotes || null,
    hazard_notes: input.hazardNotes || null,
    yard_size: input.yardSize || null,
    access_notes: input.accessNotes || null,
    active: true,
  });
  if (propertyError) redirect(`/admin/customers?error=${encodeURIComponent(propertyError.message)}`);

  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");
  redirect("/admin/customers?saved=1");
}
