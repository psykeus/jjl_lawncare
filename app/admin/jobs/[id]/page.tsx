/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { generateInvoiceForJob, updateJobChecklist, updateJobSchedule, uploadJobPhoto } from "../actions";
import { ScheduleFitSummary } from "../schedule-fit-summary";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

type ChecklistItem = { id: string; label: string; required?: boolean; completed?: boolean };

export default async function AdminJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: job }, { data: crew }, { data: media }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, customers(name, email, phone), properties(address_line_1, city, state, zip, latitude, longitude), estimate:documents!jobs_estimate_id_fkey(id, document_number, total), invoice:documents!jobs_invoice_id_fkey(id, document_number, status, balance_due)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("profiles").select("id, name, email, role").eq("role", "crew").eq("active", true).order("name"),
    supabase.from("media_files").select("id, file_url, label").eq("related_type", "job").eq("related_id", id).order("created_at"),
  ]);

  if (!job) notFound();
  const customer = one(job.customers);
  const property = one(job.properties);
  const estimate = one(job.estimate);
  const invoice = one(job.invoice);
  const checklist = (Array.isArray(job.checklist_snapshot) ? job.checklist_snapshot : []) as ChecklistItem[];
  const assignedCrewIds = new Set((job.assigned_crew_ids ?? []) as string[]);

  const photos = await Promise.all((media ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("job-photos").createSignedUrl(file.file_url, 60 * 10);
    return { ...file, signedUrl: data?.signedUrl ?? null };
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Job detail</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">{customer?.name} — {property?.address_line_1}, {property?.city}</p>
          <div className="mt-3 flex gap-2"><StatusBadge status={job.status} />{estimate ? <span className="text-sm text-[var(--muted-foreground)]">Estimate {estimate.document_number} · {formatCurrency(Number(estimate.total))}</span> : null}</div>
          {query.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
          {query.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Job saved.</div> : null}
        </div>
        {invoice ? <ButtonLink href={`/admin/invoices/${invoice.id}`} variant="outline">View invoice</ButtonLink> : (
          <form action={generateInvoiceForJob}><input type="hidden" name="jobId" value={job.id} /><Button type="submit">Generate invoice</Button></form>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <ScheduleFitSummary scheduledDate={job.scheduled_date} scheduledStartTime={job.scheduled_start_time} estimatedDurationMinutes={job.estimated_duration_minutes ?? 60} requiredCrewSize={job.required_crew_size ?? 1} excludeJobId={job.id} />

          <Card>
            <h2 className="text-xl font-bold">Schedule and assignment</h2>
            <form action={updateJobSchedule} className="mt-4 grid gap-4">
              <input type="hidden" name="jobId" value={job.id} />
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Status"><Select name="status" defaultValue={job.status}><option value="accepted">Accepted</option><option value="scheduled">Scheduled</option><option value="on_hold">On hold</option><option value="on_the_way">On the way</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="completed_unpaid">Completed unpaid</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></Select></Field>
                <Field label="Date"><Input name="scheduledDate" type="date" defaultValue={job.scheduled_date ?? ""} /></Field>
                <Field label="Start"><Input name="scheduledStartTime" type="time" defaultValue={job.scheduled_start_time ?? ""} /></Field>
                <Field label="End"><Input name="scheduledEndTime" type="time" defaultValue={job.scheduled_end_time ?? ""} /></Field>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <Field label="Estimated minutes"><Input name="estimatedDurationMinutes" type="number" min="15" defaultValue={job.estimated_duration_minutes ?? 60} /></Field>
                <Field label="Required crew"><Input name="requiredCrewSize" type="number" min="1" defaultValue={job.required_crew_size ?? 1} /></Field>
                <Field label="Earliest start"><Input name="earliestStartTime" type="time" defaultValue={job.earliest_start_time ?? ""} /></Field>
                <Field label="Latest end"><Input name="latestEndTime" type="time" defaultValue={job.latest_end_time ?? ""} /></Field>
                <Field label="Route priority"><Input name="routePriority" type="number" defaultValue={job.route_priority ?? 0} /></Field>
              </div>
              <div className="grid gap-2 rounded-xl border border-[var(--border)] p-4 text-sm">
                <h3 className="font-semibold">Assigned crew</h3>
                {(crew ?? []).map((member) => <label key={member.id}><input className="mr-2" type="checkbox" name="assignedCrewIds" value={member.id} defaultChecked={assignedCrewIds.has(member.id)} />{member.name ?? member.email}</label>)}
                {crew?.length ? null : <p className="text-[var(--muted-foreground)]">No active crew profiles yet.</p>}
              </div>
              <Field label="Tool notes"><Textarea name="toolNotes" defaultValue={job.tool_notes ?? ""} /></Field>
              <Field label="Safety notes"><Textarea name="safetyNotes" defaultValue={job.safety_notes ?? ""} /></Field>
              <Field label="Customer-visible notes"><Textarea name="customerVisibleNotes" defaultValue={job.customer_visible_notes ?? ""} /></Field>
              <Field label="Internal notes"><Textarea name="internalNotes" defaultValue={job.internal_notes ?? ""} /></Field>
              <Button type="submit">Save job</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Checklist</h2>
            <form action={updateJobChecklist} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="jobId" value={job.id} />
              {checklist.map((item) => <label key={item.id}><input className="mr-2" type="checkbox" name="completedItemIds" value={item.id} defaultChecked={item.completed} />{item.label}{item.required ? <span className="text-[var(--danger)]"> *</span> : null}</label>)}
              {checklist.length ? <Button type="submit" variant="outline">Save checklist</Button> : <p className="text-[var(--muted-foreground)]">No checklist snapshot.</p>}
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Upload job photos</h2>
            <form action={uploadJobPhoto} className="mt-4 grid gap-4">
              <input type="hidden" name="jobId" value={job.id} />
              <Field label="Photo label"><Select name="label"><option value="before">Before</option><option value="after">After</option><option value="photo">Other</option></Select></Field>
              <Field label="Photos"><Input name="photos" type="file" accept="image/*" multiple /></Field>
              <Button type="submit">Upload photos</Button>
            </form>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Customer</h2>
            <p className="mt-3 text-sm">{customer?.name}<br />{customer?.email}<br />{customer?.phone}</p>
          </Card>
          <Card>
            <h2 className="text-xl font-bold">Property</h2>
            <p className="mt-3 text-sm">{property?.address_line_1}<br />{property?.city}, {property?.state} {property?.zip}</p>
            {property?.latitude && property?.longitude ? <a className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]" href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps</a> : null}
          </Card>
          {invoice ? <Card><h2 className="text-xl font-bold">Invoice</h2><p className="mt-3 text-sm"><Link className="font-semibold text-[var(--primary)]" href={`/admin/invoices/${invoice.id}`}>{invoice.document_number}</Link><br />Balance {formatCurrency(Number(invoice.balance_due))}</p></Card> : null}
          <Card>
            <h2 className="text-xl font-bold">Photos</h2>
            <div className="mt-4 grid gap-3">
              {photos.map((photo) => photo.signedUrl ? <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[var(--border)]"><img src={photo.signedUrl} alt={`${photo.label} job`} className="h-36 w-full object-cover" /></a> : null)}
              {photos.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No job photos yet.</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
