import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerEstimatesPage() {
  const supabase = await createClient();
  const { data: estimates } = await supabase
    .from("documents")
    .select("id, document_number, status, expiration_date, total")
    .eq("document_type", "estimate")
    .order("created_at", { ascending: false });

  const rows = estimates ?? [];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Customer portal" title="My estimates" description="Review estimate scope, exclusions, price, and terms." />

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((estimate) => (
              <Card key={estimate.id} className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3"><Link href={`/customer/estimates/${estimate.id}`} className="font-black text-[var(--primary)]">{estimate.document_number}</Link><StatusBadge status={estimate.status} /></div>
                <div className="flex items-center justify-between gap-3 text-sm"><strong>{formatCurrency(Number(estimate.total))}</strong><span className="text-[var(--muted-foreground)]">Expires {formatDate(estimate.expiration_date)}</span></div>
              </Card>
            ))}
          </div>
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Estimate</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th><th className="p-3">Expires</th></tr></thead>
              <tbody>
                {rows.map((estimate) => (
                  <tr key={estimate.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="p-3 font-semibold"><Link href={`/customer/estimates/${estimate.id}`}>{estimate.document_number}</Link></td>
                    <td className="p-3 text-right tabular-nums">{formatCurrency(Number(estimate.total))}</td>
                    <td className="p-3 whitespace-nowrap"><StatusBadge status={estimate.status} /></td>
                    <td className="p-3 whitespace-nowrap">{formatDate(estimate.expiration_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No estimates yet" description="Estimates will appear here after your request is reviewed." />
      )}
    </div>
  );
}
