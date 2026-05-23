import Link from "next/link";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">My estimates</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Review estimate scope, exclusions, price, and terms.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Estimate</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Expires</th></tr></thead>
          <tbody>
            {(estimates ?? []).map((estimate) => (
              <tr key={estimate.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                <td className="p-3 font-semibold"><Link href={`/customer/estimates/${estimate.id}`}>{estimate.document_number}</Link></td>
                <td className="p-3">{formatCurrency(Number(estimate.total))}</td>
                <td className="p-3"><StatusBadge status={estimate.status} /></td>
                <td className="p-3">{formatDate(estimate.expiration_date)}</td>
              </tr>
            ))}
            {estimates?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={4}>No estimates yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
