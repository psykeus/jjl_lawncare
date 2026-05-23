"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function createExpense(formData: FormData) {
  const profile = await requireRole(["admin", "crew"]);
  const amount = Number(formData.get("amount") ?? 0);
  const category = String(formData.get("category") ?? "").trim();
  const jobId = String(formData.get("jobId") ?? "") || null;
  const expenseDate = String(formData.get("expenseDate") ?? "") || new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "");
  const reimbursed = formData.get("reimbursed") === "on";
  const receipt = formData.get("receipt");

  if (!category || !Number.isFinite(amount) || amount <= 0) redirect("/admin/expenses?error=Enter a valid category and amount");

  const supabase = await createClient();
  const { data: expense, error } = await supabase.from("expenses").insert({
    job_id: jobId,
    category,
    amount,
    paid_by: profile.id,
    expense_date: expenseDate,
    reimbursed,
    notes,
  }).select("id").single();
  if (error) redirect(`/admin/expenses?error=${encodeURIComponent(error.message)}`);

  if (receipt instanceof File && receipt.size > 0 && expense) {
    const allowed = receipt.type.startsWith("image/") || receipt.type === "application/pdf";
    if (allowed && receipt.size <= 8 * 1024 * 1024) {
      const extension = receipt.name.split(".").pop()?.toLowerCase() || (receipt.type === "application/pdf" ? "pdf" : "jpg");
      const storagePath = `${expense.id}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(storagePath, receipt, { contentType: receipt.type });
      if (!uploadError) {
        await supabase.from("media_files").insert({
          related_type: "expense",
          related_id: expense.id,
          file_url: storagePath,
          file_type: receipt.type,
          label: "receipt",
          uploaded_by: profile.id,
        });
      }
    }
  }

  revalidatePath("/admin/expenses");
  redirect("/admin/expenses?saved=1");
}
