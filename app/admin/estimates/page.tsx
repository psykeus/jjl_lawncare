import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function EstimatesPage() {
  const supabase = await createClient();
  const { data: estimates } = await supabase
    .from("documents")
    .select("id, document_number, status, issue_date, expiration_date, total, customers(name), properties(address_line_1, city)")
    .eq("document_type", "estimate")
    .order("created_at", { ascending: false });

  const rows = estimates ?? [];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Intake & Sales" title="Estimates" description="Draft, send, revise, and track customer estimates." />

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
