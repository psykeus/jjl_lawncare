import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGoogleMapsBrowserKey } from "@/lib/maps/config";
import { checkServiceArea } from "@/lib/service-area/check";
import { createClient } from "@/lib/supabase/server";
import { AdminJobMap, type AdminMapJob } from "./admin-job-map";
import { geocodeUnmappedProperties } from "./actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

type JobRow = {
  id: string;
  status: string;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  customer_visible_notes: string | null;
  customers: RelatedRow<{ name: string | null; email: string | null; phone: string | null }>;
  properties: RelatedRow<{ address_line_1: string; city: string; state: string; zip: string; latitude: number | null; longitude: number | null }>;
  estimate: RelatedRow<{ id: string; document_number: string | null; total: number | null; scope_included: string | null; quote_request_id: string | null }>;
};

type QuoteRequestRow = {
  id: string;
  customer_notes: string | null;
  preferred_dates: string | null;
  yard_size: string | null;
  grass_height: string | null;
  services: RelatedRow<{ name: string | null }>;
};

type RequestServiceRow = {
  id: string;
  quote_request_id: string;
  notes: string | null;
  estimated_duration_minutes: number | null;
  services: RelatedRow<{ name: string | null }>;
};

type RequestAnswerRow = {
  quote_request_service_id: string;
  answer_text: string | null;
  service_questions: RelatedRow<{ question_text: string | null }>;
  service_question_options: RelatedRow<{ label: string | null }>;
};

export default async function AdminMapPage({ searchParams }: { searchParams: Promise<{ error?: string; geocoded?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, status, scheduled_date, scheduled_start_time, customer_visible_notes, customers(name, email, phone), properties(address_line_1, city, state, zip, latitude, longitude), estimate:documents!jobs_estimate_id_fkey(id, document_number, total, scope_included, quote_request_id)")
    .neq("status", "cancelled")
    .order("scheduled_date", { ascending: true });

  const jobRows = (jobs ?? []) as JobRow[];
  const quoteRequestIds = Array.from(new Set(jobRows.map((job) => one(job.estimate)?.quote_request_id).filter((id): id is string => Boolean(id))));

  const [{ data: quoteRequests }, { data: mediaFiles }, { data: requestServices }] = await Promise.all([
    quoteRequestIds.length
      ? supabase.from("quote_requests").select("id, customer_notes, preferred_dates, yard_size, grass_height, services(name)").in("id", quoteRequestIds)
      : Promise.resolve({ data: [] as QuoteRequestRow[] }),
    quoteRequestIds.length
      ? supabase.from("media_files").select("id, related_id, file_url").eq("related_type", "quote_request").in("related_id", quoteRequestIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; related_id: string; file_url: string }[] }),
    quoteRequestIds.length
      ? supabase.from("quote_request_services").select("id, quote_request_id, notes, estimated_duration_minutes, services(name)").in("quote_request_id", quoteRequestIds).order("sort_order")
      : Promise.resolve({ data: [] as RequestServiceRow[] }),
  ]);

  const quoteById = new Map<string, QuoteRequestRow>((quoteRequests ?? []).map((request) => [request.id, request as QuoteRequestRow]));
  const requestServiceRows = (requestServices ?? []) as RequestServiceRow[];
  const requestServiceIds = requestServiceRows.map((service) => service.id);
  const { data: requestAnswers } = requestServiceIds.length
    ? await supabase.from("quote_request_service_answers").select("quote_request_service_id, answer_text, service_questions(question_text), service_question_options(label)").in("quote_request_service_id", requestServiceIds)
    : { data: [] as RequestAnswerRow[] };

  const answersByRequestService = new Map<string, string[]>();
  for (const answer of (requestAnswers ?? []) as RequestAnswerRow[]) {
    const question = one(answer.service_questions)?.question_text ?? "Question";
    const value = one(answer.service_question_options)?.label ?? answer.answer_text ?? "—";
    answersByRequestService.set(answer.quote_request_service_id, [...(answersByRequestService.get(answer.quote_request_service_id) ?? []), `${question}: ${value}`]);
  }

  const servicesByQuoteId = new Map<string, RequestServiceRow[]>();
  for (const service of requestServiceRows) {
    servicesByQuoteId.set(service.quote_request_id, [...(servicesByQuoteId.get(service.quote_request_id) ?? []), service]);
  }

  const photosByQuoteId = new Map<string, string[]>();
  for (const file of mediaFiles ?? []) {
    const { data } = await supabase.storage.from("quote-photos").createSignedUrl(file.file_url, 60 * 10);
    if (!data?.signedUrl) continue;
    photosByQuoteId.set(file.related_id, [...(photosByQuoteId.get(file.related_id) ?? []), data.signedUrl]);
  }

  const rawMapJobs: AdminMapJob[] = jobRows.map((job) => {
    const customer = one(job.customers);
    const property = one(job.properties);
    const estimate = one(job.estimate);
    const quote = estimate?.quote_request_id ? quoteById.get(estimate.quote_request_id) : undefined;
    const service = one(quote?.services ?? null);
    const normalizedServices = estimate?.quote_request_id ? (servicesByQuoteId.get(estimate.quote_request_id) ?? []) : [];
    const serviceSummary = normalizedServices.length
      ? normalizedServices.map((item) => {
        const relatedService = one(item.services);
        const duration = item.estimated_duration_minutes ? ` (${item.estimated_duration_minutes} min)` : "";
        return `${relatedService?.name ?? "Service"}${duration}${item.notes ? ` — ${item.notes}` : ""}`;
      }).join("; ")
      : null;
    const answerSummary = normalizedServices.flatMap((item) => answersByRequestService.get(item.id) ?? []).join("\n") || null;
    return {
      id: job.id,
      status: job.status,
      scheduledDate: job.scheduled_date,
      scheduledStartTime: job.scheduled_start_time,
      customerName: customer?.name ?? "Unknown customer",
      customerPhone: customer?.phone ?? null,
      address: property?.address_line_1 ?? "No address",
      city: property?.city ?? "",
      state: property?.state ?? "",
      zip: property?.zip ?? "",
      latitude: property?.latitude ? Number(property.latitude) : null,
      longitude: property?.longitude ? Number(property.longitude) : null,
      serviceName: service?.name ?? null,
      serviceSummary,
      answerSummary,
      requestedWork: quote?.customer_notes ?? job.customer_visible_notes,
      scopeIncluded: estimate?.scope_included ?? null,
      preferredDates: quote?.preferred_dates ?? null,
      yardSize: quote?.yard_size ?? null,
      grassHeight: quote?.grass_height ?? null,
      estimateNumber: estimate?.document_number ?? null,
      estimateTotal: estimate?.total ? Number(estimate.total) : null,
      photoUrls: estimate?.quote_request_id ? (photosByQuoteId.get(estimate.quote_request_id) ?? []) : [],
    };
  });

  const areaResults = await Promise.all(rawMapJobs.map((job) => checkServiceArea({ latitude: job.latitude, longitude: job.longitude, city: job.city, zip: job.zip })));
  const outsideAreaCount = areaResults.filter((result) => !result.inside).length;
  const mapJobs = rawMapJobs.filter((_, index) => areaResults[index]?.inside);
  const unmappedCount = mapJobs.filter((job) => !job.latitude || !job.longitude).length;
  const googleMapsBrowserKey = getGoogleMapsBrowserKey();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Internal job map</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Admin-only routing board showing each job, requested work, quote photos, and scheduled route pins.</p>
      </div>
      {params.error ? <Card className="border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] tone-danger text-sm text-[var(--danger)]">{params.error}</Card> : null}
      {params.geocoded ? <Card className="border-[color-mix(in_srgb,var(--success)_35%,var(--border))] tone-success text-sm text-[var(--success)]">Geocoded {params.geocoded} propert{params.geocoded === "1" ? "y" : "ies"}.</Card> : null}
      {outsideAreaCount ? <Card className="border-[color-mix(in_srgb,var(--info)_35%,var(--border))] tone-info text-sm text-[var(--info)]">{outsideAreaCount} job(s) are outside the Greater Cincinnati planning area and are hidden from this routing map.</Card> : null}
      {unmappedCount ? (
        <Card className="border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] tone-warning text-sm text-[var(--warning)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{unmappedCount} job(s) are missing coordinates. Run geocoding after adding or changing the Google Geocoding API key.</span>
            <form action={geocodeUnmappedProperties}><Button type="submit" variant="outline" size="sm">Geocode missing</Button></form>
          </div>
        </Card>
      ) : null}
      <AdminJobMap jobs={mapJobs} apiKey={googleMapsBrowserKey ?? undefined} />
    </div>
  );
}
