import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { createEstimateFromQuoteRequest } from "../../estimates/actions";
import { updateQuoteRequestReview } from "../actions";

export default async function QuoteRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
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

  const { data: requestServices } = await supabase
    .from("quote_request_services")
    .select("id, service_id, notes, estimated_duration_minutes, estimated_price_min, estimated_price_max, sort_order, services(name)")
    .eq("quote_request_id", id)
    .order("sort_order");

  const requestServiceRows = (requestServices ?? []) as Array<{
    id: string;
    service_id: string | null;
    notes: string | null;
    estimated_duration_minutes: number | null;
    estimated_price_min: number | string | null;
    estimated_price_max: number | string | null;
    services: { name: string | null } | { name: string | null }[] | null;
  }>;
  const requestServiceIds = requestServiceRows.map((service) => service.id);

  const [{ data: serviceAnswers }, { data: servicePhotoLinks }] = requestServiceIds.length ? await Promise.all([
    supabase
      .from("quote_request_service_answers")
      .select("id, quote_request_service_id, answer_text, service_questions(question_text), service_question_options(label)")
      .in("quote_request_service_id", requestServiceIds),
    supabase
      .from("quote_request_service_photos")
      .select("id, quote_request_service_id, media_files(id, file_url, file_type, label)")
      .in("quote_request_service_id", requestServiceIds),
  ]) : [{ data: [] }, { data: [] }];

  const answersByService = new Map<string, Array<{ question: string; answer: string }>>();
  for (const answer of serviceAnswers ?? []) {
    const row = answer as {
      quote_request_service_id: string;
      answer_text: string | null;
      service_questions: { question_text: string | null } | { question_text: string | null }[] | null;
      service_question_options: { label: string | null } | { label: string | null }[] | null;
    };
    const question = Array.isArray(row.service_questions) ? row.service_questions[0] : row.service_questions;
    const option = Array.isArray(row.service_question_options) ? row.service_question_options[0] : row.service_question_options;
    answersByService.set(row.quote_request_service_id, [...(answersByService.get(row.quote_request_service_id) ?? []), {
      question: question?.question_text ?? "Question",
      answer: option?.label ?? row.answer_text ?? "—",
    }]);
  }

  const photosByService = new Map<string, Array<{ id: string; signedUrl: string | null }>>();
  for (const link of servicePhotoLinks ?? []) {
    const row = link as { quote_request_service_id: string; media_files: { id: string; file_url: string } | { id: string; file_url: string }[] | null };
    const file = Array.isArray(row.media_files) ? row.media_files[0] : row.media_files;
    if (!file) continue;
    const { data } = await supabase.storage.from("quote-photos").createSignedUrl(file.file_url, 60 * 10);
    photosByService.set(row.quote_request_service_id, [...(photosByService.get(row.quote_request_service_id) ?? []), { id: file.id, signedUrl: data?.signedUrl ?? null }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Quote request</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">{request.customers?.name} — {request.properties?.address_line_1}</p>
          {query.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
          {query.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Review saved.</div> : null}
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
          <h2 className="text-xl font-bold">Admin review</h2>
          <form action={updateQuoteRequestReview} className="mt-4 grid gap-4">
            <input type="hidden" name="requestId" value={request.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Status"><Select name="status" defaultValue={request.status}><option value="new">New</option><option value="needs_review">Needs review</option><option value="needs_more_info">Needs more info</option><option value="site_review_needed">Site review needed</option><option value="estimate_drafted">Estimate drafted</option><option value="estimate_sent">Estimate sent</option><option value="converted_to_job">Converted to job</option><option value="declined">Declined</option><option value="archived">Archived</option></Select></Field>
              <Field label="Risk"><Select name="riskLevel" defaultValue={request.risk_level}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="decline">Decline</option></Select></Field>
            </div>
            <div className="grid gap-2 text-sm">
              <label><input className="mr-2" type="checkbox" name="parentApprovalRequired" defaultChecked={request.parent_approval_required} /> Parent/admin approval required</label>
              <label><input className="mr-2" type="checkbox" name="parentApproved" defaultChecked={Boolean(request.parent_approved_at)} /> Parent/admin approved</label>
            </div>
            <Field label="Internal notes"><Textarea name="internalNotes" defaultValue={request.internal_notes ?? ""} /></Field>
            <Button type="submit" variant="outline">Save review</Button>
          </form>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Scope notes</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{request.customer_notes || "No notes provided."}</p>
        </Card>
      </div>
      {requestServiceRows.length ? (
        <Card>
          <h2 className="text-xl font-bold">Selected services</h2>
          <div className="mt-4 grid gap-4">
            {requestServiceRows.map((service) => {
              const related = Array.isArray(service.services) ? service.services[0] : service.services;
              const answers = answersByService.get(service.id) ?? [];
              const photos = photosByService.get(service.id) ?? [];
              return (
                <div key={service.id} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{related?.name ?? "Selected service"}</h3>
                      {service.notes ? <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted-foreground)]">{service.notes}</p> : null}
                    </div>
                    <div className="text-right text-xs text-[var(--muted-foreground)]">
                      {service.estimated_duration_minutes ? <div>{service.estimated_duration_minutes} estimated minutes</div> : null}
                      {service.estimated_price_min ? <div>${Number(service.estimated_price_min).toFixed(2)}{service.estimated_price_max ? `–$${Number(service.estimated_price_max).toFixed(2)}` : ""}</div> : null}
                    </div>
                  </div>
                  {answers.length ? (
                    <dl className="mt-3 grid gap-2 text-sm">
                      {answers.map((answer, index) => <div key={`${answer.question}-${index}`}><dt className="font-semibold">{answer.question}</dt><dd className="text-[var(--muted-foreground)]">{answer.answer}</dd></div>)}
                    </dl>
                  ) : null}
                  {photos.length ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {photos.map((photo) => photo.signedUrl ? (
                        <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.signedUrl} alt="Service upload" className="h-24 w-full rounded-lg object-cover" />
                        </a>
                      ) : null)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
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
