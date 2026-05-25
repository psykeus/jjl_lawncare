import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;

function one<T>(value: RelatedRow<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AdminQuoteRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const query = (params.q ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("quote_requests")
    .select("id, status, risk_level, customer_notes, created_at, customers(name, email), properties(address_line_1, city, state)")
    .order("created_at", { ascending: false });

  const allRows = requests ?? [];
  const rows = allRows.filter((request) => {
    const customer = one(request.customers);
    const property = one(request.properties);
    const matchesStatus = status === "all" || request.status === status;
    const matchesQuery = !query || [customer?.name, customer?.email, property?.address_line_1, property?.city, request.customer_notes].some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Intake & Sales" title="Quote requests" description="Review public requests, photos, scope notes, service answers, and risk flags." />

      <Card className="p-3 sm:p-4">
        <form className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <label className="grid gap-1 text-sm font-semibold">Status<Select name="status" defaultValue={status}><option value="all">All statuses</option><option value="new">New</option><option value="needs_review">Needs review</option><option value="accepted">Accepted</option><option value="converted">Converted</option><option value="declined">Declined</option></Select></label>
          <label className="grid gap-1 text-sm font-semibold">Search<Input name="q" defaultValue={params.q ?? ""} placeholder="Customer, email, address, notes" /></label>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">Showing {rows.length} of {allRows.length} requests.</p>
      </Card>

      {rows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((request) => {
              const customer = one(request.customers);
              const property = one(request.properties);
              return (
                <Card key={request.id} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/admin/quote-requests/${request.id}`} className="font-black text-[var(--primary)]">{customer?.name ?? "Unknown"}</Link>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{customer?.email}</p>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">{formatDate(request.created_at)}</span>
                  </div>
                  <p className="rounded-xl bg-[var(--muted)] p-3 text-sm text-[var(--muted-foreground)]">{property?.address_line_1 ?? "No address"}{property ? `, ${property.city}, ${property.state}` : ""}</p>
                  <div className="flex flex-wrap gap-2"><StatusBadge status={request.status} /><StatusBadge status={request.risk_level} /></div>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Address</th><th className="p-3">Status</th><th className="p-3">Risk</th><th className="p-3">Created</th></tr></thead>
              <tbody>
                {rows.map((request) => {
                  const customer = one(request.customers);
                  const property = one(request.properties);
                  return (
                    <tr key={request.id} className="border-t border-[var(--border)] align-top hover:bg-[var(--muted)]">
                      <td className="p-3 font-semibold"><Link href={`/admin/quote-requests/${request.id}`}>{customer?.name ?? "Unknown"}</Link><div className="text-xs font-normal text-[var(--muted-foreground)]">{customer?.email}</div></td>
                      <td className="p-3">{property?.address_line_1}, {property?.city}</td>
                      <td className="p-3 whitespace-nowrap"><StatusBadge status={request.status} /></td>
                      <td className="p-3 whitespace-nowrap"><StatusBadge status={request.risk_level} /></td>
                      <td className="p-3 whitespace-nowrap">{formatDate(request.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No quote requests yet" description="New public quote requests will appear here for review." />
      )}
    </div>
  );
}
