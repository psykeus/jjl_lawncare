"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function recordInvoicePayment(formData: FormData) {
  const profile = await requireRole(["admin"]);
  const documentId = String(formData.get("documentId") ?? "");
  const jobId = String(formData.get("jobId") ?? "") || null;
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "cash");
  const notes = String(formData.get("notes") ?? "");
  const proof = formData.get("proof");
  if (!documentId || !Number.isFinite(amount) || amount <= 0) redirect(`/admin/invoices/${documentId}?error=Enter a valid payment amount`);

  const supabase = await createClient();
  const { data: invoice } = await supabase.from("documents").select("id, total, amount_paid, job_id").eq("id", documentId).maybeSingle();
  if (!invoice) redirect(`/admin/invoices/${documentId}?error=Invoice not found`);

  const nextAmountPaid = Number(invoice.amount_paid ?? 0) + amount;
  const balanceDue = Math.max(Number(invoice.total ?? 0) - nextAmountPaid, 0);
  const nextStatus = balanceDue <= 0 ? "paid" : "partially_paid";

  const { data: payment, error } = await supabase.from("payments").insert({
    document_id: documentId,
    job_id: jobId ?? invoice.job_id,
    amount,
    method,
    status: nextStatus === "paid" ? "paid" : "partially_paid",
    confirmed_by: profile.id,
    received_at: new Date().toISOString(),
    notes,
  }).select("id").single();
  if (error) redirect(`/admin/invoices/${documentId}?error=${encodeURIComponent(error.message)}`);

  if (proof instanceof File && proof.size > 0 && payment) {
    const allowed = proof.type.startsWith("image/") || proof.type === "application/pdf";
    if (allowed && proof.size <= 8 * 1024 * 1024) {
      const extension = proof.name.split(".").pop()?.toLowerCase() || (proof.type === "application/pdf" ? "pdf" : "jpg");
      const storagePath = `${payment.id}/${randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(storagePath, proof, { contentType: proof.type });
      if (!uploadError) {
        await supabase.from("media_files").insert({
          related_type: "payment",
          related_id: payment.id,
          file_url: storagePath,
          file_type: proof.type,
          label: "payment",
          uploaded_by: profile.id,
        });
      }
    }
  }

  await supabase.from("documents").update({ amount_paid: nextAmountPaid, balance_due: balanceDue, status: nextStatus }).eq("id", documentId);
  if (balanceDue <= 0 && (jobId || invoice.job_id)) {
    await supabase.from("jobs").update({ status: "paid" }).eq("id", jobId ?? invoice.job_id);
  }

  revalidatePath(`/admin/invoices/${documentId}`);
  revalidatePath("/admin/payments");
  redirect(`/admin/invoices/${documentId}?paid=1`);
}
