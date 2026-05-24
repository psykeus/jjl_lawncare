import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function CustomerRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("quote_requests")
    .select("id, status, customer_notes, preferred_dates, created_at, properties(address_line_1, city, state), services(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">My requests</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Track submitted quote requests and review status.</p>
        </div>
        <Link href="/request-quote" className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white">New request</Link>
      </div>
      <div className="grid gap-4">
        {(requests ?? []).map((request) => {
          const property = one(request.properties);
          const service = one(request.services);
          return (
            <Card key={request.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold"><Link href={`/customer/requests/${request.id}`}>{service?.name ?? "Quote request"}</Link></h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{property?.address_line_1}, {property?.city}, {property?.state}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <dl className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                <div><dt className="font-semibold">Submitted</dt><dd>{formatDate(request.created_at)}</dd></div>
                <div><dt className="font-semibold">Preferred timing</dt><dd>{request.preferred_dates || "—"}</dd></div>
                <div><dt className="font-semibold">Notes</dt><dd className="line-clamp-2 text-[var(--muted-foreground)]">{request.customer_notes || "—"}</dd></div>
              </dl>
            </Card>
          );
        })}
        {requests?.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No quote requests yet. <Link className="font-semibold text-[var(--primary)]" href="/request-quote">Submit your first request.</Link></p></Card>}
      </div>
    </div>
  );
}
