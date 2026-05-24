import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import {
  defaultBusinessSettings,
  defaultDocumentSettings,
  defaultPaymentSettings,
  defaultTaxReserveSettings,
  mergeSettings,
} from "@/lib/settings/defaults";
import {
  updateBusinessSettings,
  updateDocumentSettings,
  updatePaymentSettings,
  updateTaxReserveSettings,
} from "./actions";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value_json").in("key", ["business", "payment_public", "document", "tax_reserve"]);
  const settings = new Map((data ?? []).map((row) => [row.key, row.value_json]));

  const business = mergeSettings(defaultBusinessSettings, settings.get("business"));
  const payment = mergeSettings(defaultPaymentSettings, settings.get("payment_public"));
  const document = mergeSettings(defaultDocumentSettings, settings.get("document"));
  const taxReserve = mergeSettings(defaultTaxReserveSettings, settings.get("tax_reserve"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Business, payment, document, tax/reserve, and approval configuration.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Settings saved.</div> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <form action={updateBusinessSettings} className="grid gap-4">
            <h2 className="text-xl font-bold">Business</h2>
            <Field label="Business name"><Input name="businessName" defaultValue={business.businessName} /></Field>
            <Field label="Contact email"><Input name="contactEmail" type="email" defaultValue={business.contactEmail} /></Field>
            <Field label="Contact phone"><Input name="contactPhone" defaultValue={business.contactPhone} /></Field>
            <Field label="Business status"><Select name="businessStatus" defaultValue={business.businessStatus}><option value="active">Active</option><option value="paused">Paused</option></Select></Field>
            <Field label="Service area description"><Textarea name="serviceAreaDescription" defaultValue={business.serviceAreaDescription} /></Field>
            <Field label="Public intro text"><Textarea name="publicIntroText" defaultValue={business.publicIntroText} /></Field>
            <Field label="Public footer text"><Textarea name="publicFooterText" defaultValue={business.publicFooterText} /></Field>
            <Button type="submit">Save business settings</Button>
          </form>
        </Card>

        <Card>
          <form action={updatePaymentSettings} className="grid gap-4">
            <h2 className="text-xl font-bold">Payments</h2>
            <label className="text-sm"><input className="mr-2" type="checkbox" name="acceptCash" defaultChecked={payment.acceptCash} /> Accept cash</label>
            <label className="text-sm"><input className="mr-2" type="checkbox" name="acceptVenmo" defaultChecked={payment.acceptVenmo} /> Accept Venmo</label>
            <Field label="Venmo handle"><Input name="venmoHandle" defaultValue={payment.venmoHandle} placeholder="@handle" /></Field>
            <Field label="Cash instructions"><Textarea name="cashInstructions" defaultValue={payment.cashInstructions} /></Field>
            <Field label="Payment due wording"><Textarea name="paymentDueWording" defaultValue={payment.paymentDueWording} /></Field>
            <Field label="Late payment wording"><Textarea name="latePaymentWording" defaultValue={payment.latePaymentWording} /></Field>
            <Button type="submit">Save payment settings</Button>
          </form>
        </Card>

        <Card>
          <form action={updateDocumentSettings} className="grid gap-4">
            <h2 className="text-xl font-bold">Documents</h2>
            <Field label="Estimate prefix"><Input name="estimatePrefix" defaultValue={document.estimatePrefix} /></Field>
            <Field label="Invoice prefix"><Input name="invoicePrefix" defaultValue={document.invoicePrefix} /></Field>
            <Field label="Starting number"><Input name="startingNumber" type="number" min={1} defaultValue={document.startingNumber} /></Field>
            <Field label="Default estimate expiration days"><Input name="defaultEstimateExpirationDays" type="number" min={0} defaultValue={document.defaultEstimateExpirationDays} /></Field>
            <Field label="Default invoice due days"><Input name="defaultInvoiceDueDays" type="number" min={0} defaultValue={document.defaultInvoiceDueDays} /></Field>
            <Field label="Estimate footer note"><Textarea name="estimateFooterNote" defaultValue={document.estimateFooterNote} /></Field>
            <Field label="Invoice footer note"><Textarea name="invoiceFooterNote" defaultValue={document.invoiceFooterNote} /></Field>
            <Button type="submit">Save document settings</Button>
          </form>
        </Card>

        <Card>
          <form action={updateTaxReserveSettings} className="grid gap-4">
            <h2 className="text-xl font-bold">Tax & reserves</h2>
            <label className="text-sm"><input className="mr-2" type="checkbox" name="salesTaxEnabled" defaultChecked={taxReserve.salesTaxEnabled} /> Sales tax enabled</label>
            <Field label="Sales tax rate" hint="Use decimal form, e.g. 0.06 for 6%."><Input name="salesTaxRate" type="number" min={0} max={1} step="0.0001" defaultValue={taxReserve.salesTaxRate} /></Field>
            <Field label="Sales tax label"><Input name="salesTaxLabel" defaultValue={taxReserve.salesTaxLabel} /></Field>
            <label className="text-sm"><input className="mr-2" type="checkbox" name="applyTaxToLabor" defaultChecked={taxReserve.applyTaxToLabor} /> Apply tax to labor</label>
            <label className="text-sm"><input className="mr-2" type="checkbox" name="applyTaxToMaterials" defaultChecked={taxReserve.applyTaxToMaterials} /> Apply tax to materials</label>
            <Field label="Equipment reserve %"><Input name="equipmentReservePercent" type="number" min={0} max={100} defaultValue={taxReserve.equipmentReservePercent} /></Field>
            <Field label="Tax/savings reserve %"><Input name="taxSavingsReservePercent" type="number" min={0} max={100} defaultValue={taxReserve.taxSavingsReservePercent} /></Field>
            <Field label="Default split method"><Select name="defaultSplitMethod" defaultValue={taxReserve.defaultSplitMethod}><option value="equal">Equal split</option><option value="custom_percentage">Custom percentage</option><option value="fixed_payout">Fixed payout</option></Select></Field>
            <Button type="submit">Save tax/reserve settings</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
