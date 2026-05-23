"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

const businessSchema = z.object({
  businessName: z.string().min(1),
  contactEmail: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  serviceAreaDescription: z.string().optional().default(""),
  publicIntroText: z.string().optional().default(""),
  publicFooterText: z.string().optional().default(""),
  businessStatus: z.enum(["active", "paused"]),
});

const paymentSchema = z.object({
  acceptCash: checkbox,
  acceptVenmo: checkbox,
  venmoHandle: z.string().optional().default(""),
  cashInstructions: z.string().optional().default(""),
  paymentDueWording: z.string().optional().default(""),
  latePaymentWording: z.string().optional().default(""),
});

const documentSchema = z.object({
  estimatePrefix: z.string().min(1),
  invoicePrefix: z.string().min(1),
  startingNumber: z.coerce.number().int().min(1),
  defaultEstimateExpirationDays: z.coerce.number().int().min(0),
  defaultInvoiceDueDays: z.coerce.number().int().min(0),
  estimateFooterNote: z.string().optional().default(""),
  invoiceFooterNote: z.string().optional().default(""),
});

const taxReserveSchema = z.object({
  salesTaxEnabled: checkbox,
  salesTaxRate: z.coerce.number().min(0).max(1),
  salesTaxLabel: z.string().min(1),
  applyTaxToLabor: checkbox,
  applyTaxToMaterials: checkbox,
  equipmentReservePercent: z.coerce.number().min(0).max(100),
  taxSavingsReservePercent: z.coerce.number().min(0).max(100),
  defaultSplitMethod: z.enum(["equal", "custom_percentage", "fixed_payout"]),
});

async function upsertSetting(key: string, value: unknown) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();
  const { error } = await supabase.from("settings").upsert({ key, value_json: value, updated_by: profile.id }, { onConflict: "key" });
  if (error) redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function updateBusinessSettings(formData: FormData) {
  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid business settings")}`);
  await upsertSetting("business", parsed.data);
}

export async function updatePaymentSettings(formData: FormData) {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid payment settings")}`);
  await upsertSetting("payment_public", parsed.data);
}

export async function updateDocumentSettings(formData: FormData) {
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid document settings")}`);
  await upsertSetting("document", parsed.data);
}

export async function updateTaxReserveSettings(formData: FormData) {
  const parsed = taxReserveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid tax/reserve settings")}`);
  await upsertSetting("tax_reserve", parsed.data);
}
