/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { markJobComplete, updateCrewJobStatus, updateJobChecklist, uploadJobPhoto } from "@/app/admin/jobs/actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
type ChecklistItem = { id: string; label: string; required?: boolean; completed?: boolean };

function addressText(property: { address_line_1?: string | null; city?: string | null; state?: string | null; zip?: string | null } | null) {
  if (!property) return "";
  return [property.address_line_1, [property.city, property.state, property.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

function directionsUrl(property: { address_line_1?: string | null; city?: string | null; state?: string | null; zip?: string | null; latitude?: number | string | null; longitude?: number | string | null } | null) {
  if (!property) return "https://www.google.com/maps";
  if (property.latitude && property.longitude) return `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
  const query = addressText(property);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default async function CrewJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: job }, { data: media }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, customers(name, phone, email), properties(address_line_1, city, state, zip, latitude, longitude, gate_notes, pet_notes, hazard_notes, access_notes)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("media_files").select("id, file_url, label").eq("related_type", "job").eq("related_id", id).order("created_at"),
  ]);

  if (!job) notFound();
  const customer = one(job.customers);
  const property = one(job.properties);
  const checklist = (Array.isArray(job.checklist_snapshot) ? job.checklist_snapshot : []) as ChecklistItem[];
  const completedRequired = checklist.filter((item) => item.required).every((item) => item.completed);
  const safetyNotes = [property?.gate_notes || property?.access_notes, property?.pet_notes, property?.hazard_notes]
    .map((item) => item?.trim())
    .filter(Boolean);
  const photos = await Promise.all((media ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("job-photos").createSignedUrl(file.file_url, 60 * 10);
    return { ...file, signedUrl: data?.signedUrl ?? null };
  }));

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black sm:text-3xl">{customer?.name ?? "Job"}</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] sm:text-base">{addressText(property) || "No address saved"} · {formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</p>
          <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={job.status} />{completedRequired ? <StatusBadge status="checklist ready" /> : null}</div>
        </div>
        <ButtonLink href={directionsUrl(property)} target="_blank" rel="noreferrer" size="sm">Open directions</ButtonLink>
      </div>
      {query.error ? <Alert variant="danger">{query.error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Next action</h2>
            <form action={updateCrewJobStatus} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <input type="hidden" name="jobId" value={job.id} />
              <Field label="Update job status"><Select name="status" defaultValue={job.status === "on_the_way" ? "in_progress" : "on_the_way"}><option value="on_the_way">On the way</option><option value="in_progress">In progress</option></Select></Field>
              <Button type="submit">Update status</Button>
            </form>
            <form action={markJobComplete} className="mt-3 grid gap-2 rounded-xl border border-[var(--border)] p-3 sm:flex sm:items-center sm:justify-between">
              <input type="hidden" name="jobId" value={job.id} />
              <p className="text-sm text-[var(--muted-foreground)]">Complete required checklist items before marking the job complete.</p>
              <Button type="submit" variant={completedRequired ? "primary" : "outline"}>Mark completed</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Checklist</h2>
            <form action={updateJobChecklist} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="jobId" value={job.id} />
              {checklist.map((item) => <label key={item.id} className="flex min-h-11 items-center rounded-lg border border-[var(--border)] p-3"><input className="mr-3" type="checkbox" name="completedItemIds" value={item.id} defaultChecked={item.completed} />{item.label}{item.required ? <span className="ml-1 text-[var(--danger)]">*</span> : null}</label>)}
              {checklist.length ? <Button type="submit" variant="outline">Save checklist</Button> : <p className="text-[var(--muted-foreground)]">No checklist.</p>}
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Photos</h2>
            <form action={uploadJobPhoto} className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
              <input type="hidden" name="jobId" value={job.id} />
              <Field label="Photo label"><Select name="label"><option value="before">Before</option><option value="after">After</option><option value="photo">Other</option></Select></Field>
              <Field label="Photos"><Input name="photos" type="file" accept="image/*" multiple /></Field>
              <Button type="submit">Upload</Button>
            </form>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {photos.map((photo) => photo.signedUrl ? <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-[var(--border)]"><img src={photo.signedUrl} alt={`${photo.label} job`} className="h-36 w-full object-cover" /></a> : null)}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Job notes</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div><dt className="font-semibold">Customer notes</dt><dd className="text-[var(--muted-foreground)]">{job.customer_visible_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Tools</dt><dd className="text-[var(--muted-foreground)]">{job.tool_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Safety</dt><dd className="text-[var(--muted-foreground)]">{job.safety_notes || property?.hazard_notes || "—"}</dd></div>
            </dl>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <h2 className="text-xl font-bold">Location & contact</h2>
            <p className="mt-3 text-sm">{property?.address_line_1}<br />{property?.city}, {property?.state} {property?.zip}</p>
            <div className="mt-4 grid gap-2">
              <ButtonLink href={directionsUrl(property)} target="_blank" rel="noreferrer" className="w-full">Open directions</ButtonLink>
              {customer?.phone ? <ButtonLink href={`tel:${customer.phone}`} variant="outline" className="w-full">Call customer</ButtonLink> : null}
              {customer?.phone ? <ButtonLink href={`sms:${customer.phone}`} variant="outline" className="w-full">Text customer</ButtonLink> : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Access & safety</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {safetyNotes.length ? safetyNotes.map((note) => <p key={note} className="rounded-xl tone-warning p-3 text-[var(--warning)]">{note}</p>) : <p className="text-[var(--muted-foreground)]">No gate, pet, or hazard notes saved.</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
