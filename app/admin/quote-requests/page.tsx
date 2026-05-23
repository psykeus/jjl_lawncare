import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;

function one<T>(value: RelatedRow<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminQuoteRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("quote_requests")
    .select("id, status, risk_level, customer_notes, created_at, customers(name, email), properties(address_line_1, city, state)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Quote requests</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Review public requests, photos, scope notes, and risk flags.</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Status</th><th className="p-3">Risk</th><th className="p-3">Created</th></tr></thead>
          <tbody>
            {(requests ?? []).map((request) => {
              const customer = one(request.customers);
              const property = one(request.properties);
              return (
                <tr key={request.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                  <td className="p-3 font-semibold"><Link href={`/admin/quote-requests/${request.id}`}>{customer?.name ?? "Unknown"}</Link></td>
                  <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                  <td className="p-3"><StatusBadge status={request.status} /></td>
                  <td className="p-3"><StatusBadge status={request.risk_level} /></td>
                  <td className="p-3">{formatDate(request.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
