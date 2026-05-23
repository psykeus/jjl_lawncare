/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { markJobComplete, updateCrewJobStatus, updateJobChecklist, uploadJobPhoto } from "@/app/admin/jobs/actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }
type ChecklistItem = { id: string; label: string; required?: boolean; completed?: boolean };

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
    supabase.from("jobs").select("*, customers(name), properties(address_line_1, city, state, zip, latitude, longitude)").eq("id", id).maybeSingle(),
    supabase.from("media_files").select("id, file_url, label").eq("related_type", "job").eq("related_id", id).order("created_at"),
  ]);

  if (!job) notFound();
  const customer = one(job.customers);
  const property = one(job.properties);
  const checklist = (Array.isArray(job.checklist_snapshot) ? job.checklist_snapshot : []) as ChecklistItem[];
  const photos = await Promise.all((media ?? []).map(async (file) => {
    const { data } = await supabase.storage.from("job-photos").createSignedUrl(file.file_url, 60 * 10);
    return { ...file, signedUrl: data?.signedUrl ?? null };
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{customer?.name ?? "Job"}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{property?.address_line_1}, {property?.city} · {formatDate(job.scheduled_date)} {job.scheduled_start_time ?? ""}</p>
        <div className="mt-3"><StatusBadge status={job.status} /></div>
        {query.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Job notes</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div><dt className="font-semibold">Customer notes</dt><dd className="text-[var(--muted-foreground)]">{job.customer_visible_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Tools</dt><dd className="text-[var(--muted-foreground)]">{job.tool_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Safety</dt><dd className="text-[var(--muted-foreground)]">{job.safety_notes || "—"}</dd></div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Update status</h2>
            <form action={updateCrewJobStatus} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="jobId" value={job.id} />
              <Field label="Status"><Select name="status" defaultValue="in_progress"><option value="on_the_way">On the way</option><option value="in_progress">In progress</option></Select></Field>
              <Button type="submit">Update</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Checklist</h2>
            <form action={updateJobChecklist} className="mt-4 grid gap-3 text-sm">
              <input type="hidden" name="jobId" value={job.id} />
              {checklist.map((item) => <label key={item.id} className="rounded-lg border border-[var(--border)] p-3"><input className="mr-2" type="checkbox" name="completedItemIds" value={item.id} defaultChecked={item.completed} />{item.label}{item.required ? <span className="text-[var(--danger)]"> *</span> : null}</label>)}
              {checklist.length ? <Button type="submit" variant="outline">Save checklist</Button> : <p className="text-[var(--muted-foreground)]">No checklist.</p>}
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Photos</h2>
            <form action={uploadJobPhoto} encType="multipart/form-data" className="mt-4 grid gap-4">
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
            <h2 className="text-xl font-bold">Complete job</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Required checklist items must be complete before marking the job complete.</p>
            <form action={markJobComplete} className="mt-4"><input type="hidden" name="jobId" value={job.id} /><Button type="submit">Mark completed</Button></form>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold">Location</h2>
            <p className="mt-3 text-sm">{property?.address_line_1}<br />{property?.city}, {property?.state} {property?.zip}</p>
            {property?.latitude && property?.longitude ? <a className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]" href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`} target="_blank" rel="noreferrer">Open directions</a> : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}
