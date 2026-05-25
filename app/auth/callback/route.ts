import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/customer/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=Login link is missing or invalid. Please request a new link.", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent("That login or password reset link expired. Please request a new one.")}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/customer/dashboard", requestUrl.origin));
}
