import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { convertEstimateToJob } from "@/app/admin/jobs/actions";
import { addEstimateItem, sendEstimate, updateEstimateDetails } from "../actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function EstimateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; sent?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: estimate }, { data: items }, { data: services }] = await Promise.all([
    supabase.from("documents").select("*, customers(name, email), properties(address_line_1, city, state, zip)").eq("id", id).eq("document_type", "estimate").maybeSingle(),
    supabase.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    supabase.from("services").select("id, name, base_price, min_price, unit_label, service_type").eq("active", true).order("sort_order"),
  ]);

  if (!estimate) notFound();
  const customer = one(estimate.customers);
  const property = one(estimate.properties);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Estimate {estimate.document_number}</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">{customer?.name} — {property?.address_line_1}, {property?.city}</p>
          <div className="mt-3 flex gap-2"><StatusBadge status={estimate.status} /><span className="text-sm text-[var(--muted-foreground)]">Expires {formatDate(estimate.expiration_date)}</span></div>
          {query.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
          {query.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Estimate saved.</div> : null}
          {query.sent ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Estimate marked sent.</div> : null}
        </div>
        {estimate.status === "accepted" ? (
          <form action={convertEstimateToJob}>
            <input type="hidden" name="estimateId" value={estimate.id} />
            <Button type="submit">Convert to job</Button>
          </form>
        ) : (
          <form action={sendEstimate}>
            <input type="hidden" name="documentId" value={estimate.id} />
            <input type="hidden" name="quoteRequestId" value={estimate.quote_request_id ?? ""} />
            <Button type="submit">Send estimate</Button>
          </form>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Line items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--muted)]"><tr><th className="p-3">Description</th><th className="p-3">Qty</th><th className="p-3">Unit</th><th className="p-3">Total</th></tr></thead>
                <tbody>
                  {(items ?? []).map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">{Number(item.quantity)}</td>
                      <td className="p-3">{formatCurrency(Number(item.unit_price))}</td>
                      <td className="p-3 font-semibold">{formatCurrency(Number(item.line_total))}</td>
                    </tr>
                  ))}
                  {items?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={4}>No line items yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Add line item</h2>
            <form action={addEstimateItem} className="mt-4 grid gap-4">
              <input type="hidden" name="documentId" value={estimate.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Catalog service">
                  <Select name="serviceId">
                    <option value="">Custom item</option>
                    {(services ?? []).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                  </Select>
                </Field>
                <Field label="Item type">
                  <Select name="itemType" defaultValue="service">
                    <option value="service">Service</option>
                    <option value="add_on">Add-on</option>
                    <option value="material">Material</option>
                    <option value="discount">Discount</option>
                    <option value="custom">Custom</option>
                  </Select>
                </Field>
              </div>
              <Field label="Description"><Input name="description" required /></Field>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Quantity"><Input name="quantity" type="number" step="0.01" defaultValue="1" required /></Field>
                <Field label="Unit price"><Input name="unitPrice" type="number" step="0.01" defaultValue="0" required /></Field>
                <Field label="Unit label"><Input name="unitLabel" placeholder="each, bag, hour" /></Field>
                <label className="mt-8 text-sm"><input className="mr-2" type="checkbox" name="taxable" defaultChecked /> Taxable</label>
              </div>
              <Button type="submit">Add item</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Scope and notes</h2>
            <form action={updateEstimateDetails} className="mt-4 grid gap-4">
              <input type="hidden" name="documentId" value={estimate.id} />
              <Field label="Scope included"><Textarea name="scopeIncluded" defaultValue={estimate.scope_included ?? ""} required /></Field>
              <Field label="Scope excluded"><Textarea name="scopeExcluded" defaultValue={estimate.scope_excluded ?? ""} required /></Field>
              <Field label="Customer notes"><Textarea name="customerNotes" defaultValue={estimate.customer_notes ?? ""} /></Field>
              <Field label="Internal notes"><Textarea name="internalNotes" defaultValue={estimate.internal_notes ?? ""} /></Field>
              <Button type="submit">Save details</Button>
            </form>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Totals</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(Number(estimate.subtotal))}</dd></div>
              <div className="flex justify-between"><dt>Discounts</dt><dd>{formatCurrency(Number(estimate.discount_total))}</dd></div>
              <div className="flex justify-between"><dt>Tax</dt><dd>{formatCurrency(Number(estimate.tax_total))}</dd></div>
              <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-black"><dt>Total</dt><dd>{formatCurrency(Number(estimate.total))}</dd></div>
            </dl>
          </Card>
          <Card>
            <h2 className="text-xl font-bold">Customer</h2>
            <p className="mt-3 text-sm">{customer?.name}<br />{customer?.email}</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
