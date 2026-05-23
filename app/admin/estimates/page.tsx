import Link from "next/link";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Estimates</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Draft, send, revise, and track customer estimates.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Number</th><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Expires</th></tr></thead>
          <tbody>
            {(estimates ?? []).map((estimate) => {
              const customer = one(estimate.customers);
              const property = one(estimate.properties);
              return (
                <tr key={estimate.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="p-3 font-semibold"><Link href={`/admin/estimates/${estimate.id}`}>{estimate.document_number ?? "Draft"}</Link></td>
                  <td className="p-3">{customer?.name ?? "Unknown"}</td>
                  <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                  <td className="p-3">{formatCurrency(Number(estimate.total))}</td>
                  <td className="p-3"><StatusBadge status={estimate.status} /></td>
                  <td className="p-3">{formatDate(estimate.expiration_date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
