import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function EstimatesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const query = (params.q ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const { data: estimates } = await supabase
    .from("documents")
    .select("id, document_number, status, issue_date, expiration_date, total, customers(name), properties(address_line_1, city)")
    .eq("document_type", "estimate")
    .order("created_at", { ascending: false });

  const allRows = estimates ?? [];
  const rows = allRows.filter((estimate) => {
    const customer = one(estimate.customers);
    const property = one(estimate.properties);
    const matchesStatus = status === "all" || estimate.status === status;
    const matchesQuery = !query || [estimate.document_number, customer?.name, property?.address_line_1, property?.city].some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Intake & Sales" title="Estimates" description="Draft, send, revise, and track customer estimates." />

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <label className="grid gap-1 text-sm font-semibold">Status<Select name="status" defaultValue={status}><option value="all">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="viewed">Viewed</option><option value="accepted">Accepted</option><option value="expired">Expired</option><option value="declined">Declined</option></Select></label>
          <label className="grid gap-1 text-sm font-semibold">Search<Input name="q" defaultValue={params.q ?? ""} placeholder="Number, customer, address" /></label>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Showing {rows.length} of {allRows.length} estimates.</p>
      </Card>

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((estimate) => {
              const customer = one(estimate.customers);
              const property = one(estimate.properties);
              return (
                <Card key={estimate.id} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/estimates/${estimate.id}`} className="font-black text-[var(--primary)]">{estimate.document_number ?? "Draft"}</Link>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{customer?.name ?? "Unknown"}</p>
                    </div>
                    <StatusBadge status={estimate.status} />
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "No address"}{property?.city ? `, ${property.city}` : ""}</p>
                  <div className="flex items-center justify-between gap-3 text-sm"><strong>{formatCurrency(Number(estimate.total))}</strong><span className="text-[var(--muted-foreground)]">Expires {formatDate(estimate.expiration_date)}</span></div>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Number</th><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th><th className="p-3">Expires</th></tr></thead>
              <tbody>
                {rows.map((estimate) => {
                  const customer = one(estimate.customers);
                  const property = one(estimate.properties);
                  return (
                    <tr key={estimate.id} className="border-t border-[var(--border)] align-top hover:bg-[var(--muted)]">
                      <td className="p-3 font-semibold"><Link href={`/admin/estimates/${estimate.id}`}>{estimate.document_number ?? "Draft"}</Link></td>
                      <td className="p-3">{customer?.name ?? "Unknown"}</td>
                      <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                      <td className="p-3 text-right tabular-nums">{formatCurrency(Number(estimate.total))}</td>
                      <td className="p-3 whitespace-nowrap"><StatusBadge status={estimate.status} /></td>
                      <td className="p-3 whitespace-nowrap">{formatDate(estimate.expiration_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No estimates yet" description="Create estimates from reviewed quote requests." />
      )}
    </div>
  );
}
