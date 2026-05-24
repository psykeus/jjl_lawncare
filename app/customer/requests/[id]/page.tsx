/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

type RequestService = {
  id: string;
  notes: string | null;
  estimated_duration_minutes: number | null;
  estimated_price_min: string | number | null;
  estimated_price_max: string | number | null;
  services: RelatedRow<{ name: string | null; public_description: string | null }>;
};

type AnswerRow = {
  quote_request_service_id: string;
  answer_text: string | null;
  service_questions: RelatedRow<{ question_text: string | null }>;
  service_question_options: RelatedRow<{ label: string | null }>;
};

export default async function CustomerRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("quote_requests")
    .select("id, status, risk_level, customer_notes, preferred_dates, created_at, properties(address_line_1, address_line_2, city, state, zip, gate_notes, yard_size), services(name)")
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();

  const { data: requestServices } = await supabase
    .from("quote_request_services")
    .select("id, notes, estimated_duration_minutes, estimated_price_min, estimated_price_max, services(name, public_description)")
    .eq("quote_request_id", id)
    .order("sort_order");
  const serviceRows = (requestServices ?? []) as RequestService[];
  const requestServiceIds = serviceRows.map((service) => service.id);

  const [{ data: answers }, { data: media }] = requestServiceIds.length ? await Promise.all([
    supabase.from("quote_request_service_answers").select("quote_request_service_id, answer_text, service_questions(question_text), service_question_options(label)").in("quote_request_service_id", requestServiceIds),
    supabase.from("media_files").select("id, file_url").eq("related_type", "quote_request").eq("related_id", id).order("created_at"),
  ]) : [{ data: [] }, await supabase.from("media_files").select("id, file_url").eq("related_type", "quote_request").eq("related_id", id).order("created_at")];

  const answersByService = new Map<string, Array<{ question: string; answer: string }>>();
  for (const answer of (answers ?? []) as AnswerRow[]) {
    const question = one(answer.service_questions)?.question_text ?? "Question";
    const value = one(answer.service_question_options)?.label ?? answer.answer_text ?? "—";
    answersByService.set(answer.quote_request_service_id, [...(answersByService.get(answer.quote_request_service_id) ?? []), { question, answer: value }]);
  }

  const signedPhotos = await Promise.all((media ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("quote-photos").createSignedUrl(file.file_url, 60 * 10);
    return { id: file.id, signedUrl: data?.signedUrl ?? null };
  }));

  const property = one(request.properties);
  const legacyService = one(request.services);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/customer/requests" className="text-sm font-semibold text-[var(--primary)]">← My requests</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Quote request</h1>
            <p className="mt-2 text-[var(--muted-foreground)]">Submitted {formatDate(request.created_at)}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Requested services</h2>
            <div className="mt-4 grid gap-4">
              {serviceRows.map((service) => {
                const related = one(service.services);
                const serviceAnswers = answersByService.get(service.id) ?? [];
                return (
                  <div key={service.id} className="rounded-xl border border-[var(--border)] p-4">
                    <h3 className="font-bold">{related?.name ?? legacyService?.name ?? "Selected service"}</h3>
                    {related?.public_description ? <p className="mt-1 text-sm text-[var(--muted-foreground)]">{related.public_description}</p> : null}
                    {service.notes ? <p className="mt-3 whitespace-pre-wrap text-sm">{service.notes}</p> : null}
                    {serviceAnswers.length ? <dl className="mt-3 grid gap-2 text-sm">{serviceAnswers.map((answer, index) => <div key={`${answer.question}-${index}`}><dt className="font-semibold">{answer.question}</dt><dd className="text-[var(--muted-foreground)]">{answer.answer}</dd></div>)}</dl> : null}
                  </div>
                );
              })}
              {serviceRows.length ? null : <p className="text-sm text-[var(--muted-foreground)]">{legacyService?.name ?? "Request details are being reviewed."}</p>}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-bold">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{request.customer_notes || "No extra notes."}</p>
          </Card>
          <Card>
            <h2 className="text-xl font-bold">Uploaded photos</h2>
            {signedPhotos.length ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{signedPhotos.map((photo) => photo.signedUrl ? <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer"><img src={photo.signedUrl} alt="Request upload" className="h-28 w-full rounded-lg object-cover" /></a> : null)}</div> : <p className="mt-3 text-sm text-[var(--muted-foreground)]">No photos found.</p>}
          </Card>
        </div>
        <aside className="space-y-4">
          <Card><h2 className="text-xl font-bold">Property</h2><p className="mt-3 text-sm">{property?.address_line_1}<br />{property?.address_line_2 ? <>{property.address_line_2}<br /></> : null}{property?.city}, {property?.state} {property?.zip}</p><dl className="mt-4 grid gap-2 text-sm"><div><dt className="font-semibold">Yard size</dt><dd>{property?.yard_size ?? "—"}</dd></div><div><dt className="font-semibold">Gate/access</dt><dd>{property?.gate_notes ?? "—"}</dd></div></dl></Card>
          <Card><h2 className="text-xl font-bold">Timing</h2><p className="mt-3 text-sm text-[var(--muted-foreground)]">{request.preferred_dates || "No preference provided."}</p></Card>
          <Card><h2 className="text-xl font-bold">Review status</h2><div className="mt-3 flex gap-2"><StatusBadge status={request.status} /><StatusBadge status={request.risk_level} /></div></Card>
        </aside>
      </div>
    </div>
  );
}
