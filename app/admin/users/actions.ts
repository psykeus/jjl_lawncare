"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const roleSchema = z.enum(["customer", "crew", "admin"]);
const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().default(""),
  role: roleSchema,
  password: z.string().trim().optional().default(""),
  active: checkbox.default(true),
});

const updateAccessSchema = z.object({
  profileId: z.string().uuid(),
  authUserId: z.string().uuid(),
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional().default(""),
  role: roleSchema,
  active: checkbox.default(false),
});

const accountActionSchema = z.object({
  profileId: z.string().uuid(),
  authUserId: z.string().uuid(),
});

const passwordResetSchema = z.object({
  profileId: z.string().uuid(),
  authUserId: z.string().uuid(),
  email: z.string().trim().email("Valid email is required"),
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

async function setAuthBan(authUserId: string, active: boolean) {
  const supabase = createAdminClient();
  const attributes = { ban_duration: active ? "none" : "876000h" } as unknown as Parameters<typeof supabase.auth.admin.updateUserById>[1];
  await supabase.auth.admin.updateUserById(authUserId, attributes);
}

async function profileHasBlockingReferences(profileId: string) {
  const supabase = createAdminClient();
  const checks = await Promise.all([
    supabase.from("activity_log").select("id", { count: "exact", head: true }).eq("actor_id", profileId),
    supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("parent_approved_by", profileId),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("confirmed_by", profileId),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("paid_by", profileId),
    supabase.from("media_files").select("id", { count: "exact", head: true }).eq("uploaded_by", profileId),
    supabase.from("settings").select("id", { count: "exact", head: true }).eq("updated_by", profileId),
  ]);
  return checks.reduce((total, result) => total + (result.count ?? 0), 0);
}

export async function createPlatformUser(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    password: formData.get("password"),
    active: formData.get("active") ?? "on",
  });
  if (!parsed.success) redirect(`/admin/users?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid user")}`);
  const input = parsed.data;
  const supabase = createAdminClient();
  const existingUser = await findAuthUserByEmail(input.email);
  const authUser = existingUser ?? (await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password || `JJL-${randomUUID().slice(0, 12)}!`,
    email_confirm: true,
    user_metadata: { name: input.name },
  })).data.user;
  if (!authUser) redirect("/admin/users?error=Could not create auth user");

  const { data: existingProfile } = await supabase.from("profiles").select("id").eq("auth_user_id", authUser.id).maybeSingle();
  const payload = { auth_user_id: authUser.id, name: input.name, email: input.email, phone: input.phone || null, role: input.role, active: input.active };
  const profileId = existingProfile?.id ?? (await supabase.from("profiles").insert(payload).select("id").single()).data?.id;
  if (existingProfile) await supabase.from("profiles").update(payload).eq("id", existingProfile.id);
  await setAuthBan(authUser.id, input.active);
  await supabase.from("activity_log").insert({ actor_id: actor.id, action: "user_access_created", related_type: "profile", related_id: profileId, metadata_json: { role: input.role, active: input.active } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  redirect("/admin/users?saved=1");
}

export async function updateUserAccess(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const parsed = updateAccessSchema.safeParse({
    profileId: formData.get("profileId"),
    authUserId: formData.get("authUserId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    active: formData.get("active"),
  });
  if (!parsed.success) redirect(`/admin/users?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid access update")}`);
  const input = parsed.data;
  if (actor.id === input.profileId && (!input.active || input.role !== "admin")) redirect("/admin/users?error=You cannot remove your own admin access or ban yourself.");
  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    role: input.role,
    active: input.active,
  }).eq("id", input.profileId);
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  await supabase.auth.admin.updateUserById(input.authUserId, { email: input.email, phone: input.phone || undefined, user_metadata: { name: input.name } });
  await setAuthBan(input.authUserId, input.active);
  await supabase.from("activity_log").insert({ actor_id: actor.id, action: input.active ? "user_access_updated" : "user_banned", related_type: "profile", related_id: input.profileId, metadata_json: { role: input.role, active: input.active } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  redirect("/admin/users?saved=1");
}

export async function sendPasswordResetEmail(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const parsed = passwordResetSchema.safeParse({
    profileId: formData.get("profileId"),
    authUserId: formData.get("authUserId"),
    email: formData.get("email"),
  });
  if (!parsed.success) redirect(`/admin/users?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid password reset request")}`);
  const input = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`;
  const supabase = createAdminClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, { redirectTo });
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  await supabase.from("activity_log").insert({ actor_id: actor.id, action: "user_password_reset_sent", related_type: "profile", related_id: input.profileId, metadata_json: { authUserId: input.authUserId, email: input.email } });
  revalidatePath("/admin/users");
  redirect("/admin/users?reset=1");
}

export async function archiveUserAccount(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const parsed = accountActionSchema.safeParse({ profileId: formData.get("profileId"), authUserId: formData.get("authUserId") });
  if (!parsed.success) redirect("/admin/users?error=Invalid account archive request");
  const { profileId, authUserId } = parsed.data;
  if (actor.id === profileId) redirect("/admin/users?error=You cannot archive or ban your own admin account.");
  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ active: false }).eq("id", profileId);
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  await supabase.from("customers").update({ status: "archived" }).eq("profile_id", profileId);
  await setAuthBan(authUserId, false);
  await supabase.from("activity_log").insert({ actor_id: actor.id, action: "user_archived", related_type: "profile", related_id: profileId, metadata_json: { archivedCustomerRecords: true } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");
  redirect("/admin/users?archived=1");
}

export async function deleteUserAccount(formData: FormData) {
  const actor = await requireRole(["admin"]);
  const parsed = accountActionSchema.safeParse({ profileId: formData.get("profileId"), authUserId: formData.get("authUserId") });
  if (!parsed.success) redirect("/admin/users?error=Invalid account delete request");
  const { profileId, authUserId } = parsed.data;
  if (String(formData.get("confirmDelete") ?? "") !== "DELETE") redirect("/admin/users?error=Type DELETE to confirm permanent account deletion.");
  if (actor.id === profileId) redirect("/admin/users?error=You cannot delete your own admin account.");
  const supabase = createAdminClient();
  const blockingCount = await profileHasBlockingReferences(profileId);
  if (blockingCount > 0) {
    redirect(`/admin/users?error=${encodeURIComponent(`This account has ${blockingCount} linked activity/payment/media/approval record(s). Archive it instead to preserve audit history.`)}`);
  }
  await supabase.from("activity_log").insert({ actor_id: actor.id, action: "user_deleted", related_type: "profile", related_id: profileId, metadata_json: { authUserId } });
  await supabase.from("customers").update({ profile_id: null, status: "archived" }).eq("profile_id", profileId);
  await supabase.from("crew_availability").delete().eq("profile_id", profileId);
  const { error: authError } = await supabase.auth.admin.deleteUser(authUserId);
  if (authError) redirect(`/admin/users?error=${encodeURIComponent(authError.message)}`);
  await supabase.from("profiles").delete().eq("id", profileId);
  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");
  redirect("/admin/users?deleted=1");
}
