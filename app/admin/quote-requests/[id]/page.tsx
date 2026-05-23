import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { createEstimateFromQuoteRequest } from "../../estimates/actions";

export default async function QuoteRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("quote_requests")
    .select("*, customers(*), properties(*)")
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();

  const { data: media } = await supabase
    .from("media_files")
    .select("id, file_url, file_type, label")
    .eq("related_type", "quote_request")
    .eq("related_id", id)
    .order("created_at", { ascending: true });

  const signedPhotos = await Promise.all(
    (media ?? []).map(async (file) => {
      const { data } = await supabase.storage.from("quote-photos").createSignedUrl(file.file_url, 60 * 10);
      return { ...file, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Quote request</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">{request.customers?.name} — {request.properties?.address_line_1}</p>
          {query.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
        </div>
        <form action={createEstimateFromQuoteRequest}>
          <input type="hidden" name="quoteRequestId" value={request.id} />
          <Button type="submit">Create estimate</Button>
        </form>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Customer</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div><dt className="font-semibold">Name</dt><dd>{request.customers?.name}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd>{request.customers?.email}</dd></div>
            <div><dt className="font-semibold">Phone</dt><dd>{request.customers?.phone}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Property</h2>
          <p className="mt-4 text-sm">{request.properties?.address_line_1}<br />{request.properties?.city}, {request.properties?.state} {request.properties?.zip}</p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Request status</h2>
          <div className="mt-4 flex gap-2"><StatusBadge status={request.status} /><StatusBadge status={request.risk_level} /></div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Scope notes</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{request.customer_notes || "No notes provided."}</p>
        </Card>
      </div>
      <Card>
        <h2 className="text-xl font-bold">Photos</h2>
        {signedPhotos.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {signedPhotos.map((photo) => photo.signedUrl ? (
              <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.signedUrl} alt="Quote request upload" className="h-48 w-full object-cover" />
              </a>
            ) : null)}
          </div>
        ) : <p className="mt-3 text-sm text-[var(--muted-foreground)]">No photos uploaded.</p>}
      </Card>
    </div>
  );
}
