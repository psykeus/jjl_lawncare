import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "customer" | "crew" | "admin";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, auth_user_id, name, email, phone, role, active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  return data as null | {
    id: string;
    auth_user_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: AppRole;
    active: boolean;
  };
}

export async function requireRole(roles: AppRole[]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.active) redirect("/auth/login");
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}
