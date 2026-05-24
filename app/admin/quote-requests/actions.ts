"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function updateQuoteRequestReview(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const requestId = String(formData.get("requestId") ?? "");
  const parentApproved = formData.get("parentApproved") === "on";
  const parentApprovalRequired = formData.get("parentApprovalRequired") === "on";
  const supabase = await createClient();
  const { error } = await supabase.from("quote_requests").update({
    status: String(formData.get("status") ?? "new"),
    risk_level: String(formData.get("riskLevel") ?? "low"),
    internal_notes: String(formData.get("internalNotes") ?? "") || null,
    parent_approval_required: parentApprovalRequired,
    parent_approved_at: parentApproved ? new Date().toISOString() : null,
    parent_approved_by: parentApproved ? profile.id : null,
  }).eq("id", requestId);
  if (error) redirect(`/admin/quote-requests/${requestId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/quote-requests/${requestId}`);
  revalidatePath("/admin/quote-requests");
  redirect(`/admin/quote-requests/${requestId}?saved=1`);
}
