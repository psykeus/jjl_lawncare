import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDate } from "@/lib/utils";
import { acceptEstimate } from "../actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function CustomerEstimateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; accepted?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login");

  const { id } = await params;
  const query = await searchParams;
  const supabase = createAdminClient();
  const [{ data: estimate }, { data: items }, { data: terms }] = await Promise.all([
    supabase.from("documents").select("*, customers(name, email, profile_id), properties(address_line_1, city, state, zip)").eq("id", id).eq("document_type", "estimate").maybeSingle(),
    supabase.from("document_items").select("*").eq("document_id", id).order("sort_order"),
    supabase.from("terms_versions").select("title, version, body").eq("active", true).order("effective_date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!estimate) notFound();
  const customer = one(estimate.customers);
  const property = one(estimate.properties);
  const isOwner = profile.role === "admin" || customer?.profile_id === profile.id || customer?.email?.toLowerCase() === profile.email?.toLowerCase();
  if (!isOwner) redirect("/customer/dashboard");

  if (estimate.status === "sent") {
    await supabase.from("documents").update({ status: "viewed" }).eq("id", estimate.id);
    estimate.status = "viewed";
  }

  const canAccept = estimate.status === "viewed" || estimate.status === "sent";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/customer/estimates" className="text-sm font-bold text-[var(--primary)]">← Back to estimates</Link>
        <h1 className="mt-2 text-3xl font-black">Estimate {estimate.document_number}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{property?.address_line_1}, {property?.city}, {property?.state} {property?.zip}</p>
        <div className="mt-3 flex gap-2"><StatusBadge status={estimate.status} /><span className="text-sm text-[var(--muted-foreground)]">Expires {formatDate(estimate.expiration_date)}</span></div>
        {query.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
        {query.accepted ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Estimate accepted. The crew/admin team can now schedule your job.</div> : null}
      </div>

      <Card>
        <h2 className="text-xl font-bold">Scope</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><h3 className="font-semibold">Included</h3><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{estimate.scope_included}</p></div>
          <div><h3 className="font-semibold">Excluded</h3><p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{estimate.scope_excluded}</p></div>
        </div>
      </Card>

      <div className="grid gap-3 md:hidden">
        {(items ?? []).map((item) => (
          <Card key={item.id} className="grid gap-2 p-4">
            <h2 className="font-bold">{item.description}</h2>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--muted)] p-3 text-sm">
              <div><span className="block text-[var(--muted-foreground)]">Qty</span><strong>{Number(item.quantity)}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Unit</span><strong>{formatCurrency(Number(item.unit_price))}</strong></div>
              <div><span className="block text-[var(--muted-foreground)]">Total</span><strong>{formatCurrency(Number(item.line_total))}</strong></div>
            </div>
          </Card>
        ))}
        <Card className="grid gap-2 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(Number(estimate.subtotal))}</strong></div>
          <div className="flex justify-between"><span>Tax</span><strong>{formatCurrency(Number(estimate.tax_total))}</strong></div>
          <div className="flex justify-between border-t border-[var(--border)] pt-2 text-lg font-black"><span>Total</span><span>{formatCurrency(Number(estimate.total))}</span></div>
        </Card>
      </div>

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Description</th><th className="p-3">Qty</th><th className="p-3">Unit</th><th className="p-3">Total</th></tr></thead>
          <tbody>
            {(items ?? []).map((item) => (
              <tr key={item.id} className="border-t border-[var(--border)]"><td className="p-3">{item.description}</td><td className="p-3">{Number(item.quantity)}</td><td className="p-3">{formatCurrency(Number(item.unit_price))}</td><td className="p-3 font-semibold">{formatCurrency(Number(item.line_total))}</td></tr>
            ))}
          </tbody>
          <tfoot className="border-t border-[var(--border)] bg-[var(--card)] font-semibold">
            <tr><td className="p-3" colSpan={3}>Subtotal</td><td className="p-3">{formatCurrency(Number(estimate.subtotal))}</td></tr>
            <tr><td className="p-3" colSpan={3}>Tax</td><td className="p-3">{formatCurrency(Number(estimate.tax_total))}</td></tr>
            <tr className="text-lg font-black"><td className="p-3" colSpan={3}>Total</td><td className="p-3">{formatCurrency(Number(estimate.total))}</td></tr>
          </tfoot>
        </table>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Terms</h2>
        <p className="mt-2 text-sm font-semibold">{terms?.title ?? "Terms"} {terms?.version ? `v${terms.version}` : ""}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{terms?.body ?? "Terms acceptance is required before scheduling."}</p>
      </Card>

      {canAccept ? (
        <Card>
          <h2 className="text-xl font-bold">Accept estimate</h2>
          <form action={acceptEstimate} className="mt-4 grid gap-4">
            <input type="hidden" name="documentId" value={estimate.id} />
            <label className="text-sm"><input className="mr-2" type="checkbox" name="acceptedTerms" required /> I accept this estimate, scope, exclusions, price, and terms.</label>
            <Field label="Type your name"><Input name="acceptedName" defaultValue={customer?.name ?? ""} required /></Field>
            <Button type="submit" size="lg">Accept estimate</Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
