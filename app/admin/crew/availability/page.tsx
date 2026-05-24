import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { deactivateCrewAvailability, upsertCrewAvailability } from "./actions";

function today() { return new Date().toISOString().slice(0, 10); }

type AvailabilityRow = {
  id: string;
  profile_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  max_hours: number | string | null;
  notes: string | null;
  active: boolean;
  profiles: { name: string | null; email: string | null } | { name: string | null; email: string | null }[] | null;
};

export default async function CrewAvailabilityPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; date?: string }> }) {
  const params = await searchParams;
  const date = params.date ?? today();
  const supabase = await createClient();
  const [{ data: crew }, { data: availability, error }] = await Promise.all([
    supabase.from("profiles").select("id, name, email").eq("role", "crew").eq("active", true).order("name"),
    supabase.from("crew_availability").select("id, profile_id, available_date, start_time, end_time, max_hours, notes, active, profiles(name, email)").gte("available_date", date).order("available_date").order("start_time"),
  ]);
  const rows = (availability ?? []) as AvailabilityRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Crew availability</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Tell the scheduler who is available and for how long each day.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Availability saved.</div> : null}
        {error ? <div className="mt-4 rounded-lg tone-warning p-3 text-sm text-[var(--warning)]">Crew availability table is not available yet. Apply db/migrations/007_scheduling_planning.sql.</div> : null}
      </div>

      <Card>
        <h2 className="text-xl font-bold">Add availability</h2>
        <form action={upsertCrewAvailability} className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Crew member"><Select name="profileId" required>{(crew ?? []).map((member) => <option key={member.id} value={member.id}>{member.name ?? member.email}</option>)}</Select></Field>
          <Field label="Date"><Input name="availableDate" type="date" defaultValue={date} required /></Field>
          <Field label="Max hours"><Input name="maxHours" type="number" step="0.25" placeholder="optional" /></Field>
          <Field label="Start"><Input name="startTime" type="time" defaultValue="09:00" required /></Field>
          <Field label="End"><Input name="endTime" type="time" defaultValue="17:00" required /></Field>
          <label className="self-end text-sm"><input className="mr-2" type="checkbox" name="active" defaultChecked /> Active</label>
          <div className="md:col-span-3"><Field label="Notes"><Textarea name="notes" /></Field></div>
          <div className="md:col-span-3"><Button type="submit">Save availability</Button></div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Date</th><th className="p-3">Crew</th><th className="p-3">Window</th><th className="p-3">Max hours</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
          <tbody>
            {rows.map((row) => {
              const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
              return <tr key={row.id} className="border-t border-[var(--border)]"><td className="p-3">{formatDate(row.available_date)}</td><td className="p-3">{profile?.name ?? profile?.email}</td><td className="p-3">{row.start_time}–{row.end_time}</td><td className="p-3">{row.max_hours ?? "—"}</td><td className="p-3">{row.active ? "Active" : "Inactive"}</td><td className="p-3">{row.active ? <form action={deactivateCrewAvailability}><input type="hidden" name="id" value={row.id} /><Button type="submit" size="sm" variant="ghost">Deactivate</Button></form> : null}</td></tr>;
            })}
            {rows.length ? null : <tr><td colSpan={6} className="p-3 text-[var(--muted-foreground)]">No availability entered.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
