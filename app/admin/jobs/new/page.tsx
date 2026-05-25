import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createAdminJob } from "../actions";
import { ScheduleFitSummary } from "../schedule-fit-summary";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function NewAdminJobPage({ searchParams }: { searchParams: Promise<{ customerId?: string; error?: string; scheduledDate?: string; scheduledStartTime?: string; scheduledEndTime?: string; estimatedDurationMinutes?: string; requiredCrewSize?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: properties }, { data: services }, { data: crew }] = await Promise.all([
    supabase.from("properties").select("id, customer_id, address_line_1, city, state, zip, customers(name)").eq("active", true).order("created_at", { ascending: false }),
    supabase.from("services").select("id, name, service_type").eq("active", true).order("sort_order"),
    supabase.from("profiles").select("id, name, email").eq("role", "crew").eq("active", true).order("name"),
  ]);

  const filteredProperties = params.customerId ? (properties ?? []).filter((property) => property.customer_id === params.customerId) : (properties ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Create direct job</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Use this for phone/text/admin-entered work that did not start as a public quote request.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
      </div>

      <ScheduleFitSummary scheduledDate={params.scheduledDate} scheduledStartTime={params.scheduledStartTime} estimatedDurationMinutes={params.estimatedDurationMinutes ?? 60} requiredCrewSize={params.requiredCrewSize ?? 1} />

      <Card>
        <form action={createAdminJob} className="grid gap-4">
          <Field label="Customer property" hint="Create a customer first if their property is missing.">
            <Select name="propertyId" required>
              <option value="">Select a property</option>
              {filteredProperties.map((property) => {
                const customer = one(property.customers);
                return <option key={property.id} value={property.id}>{customer?.name ?? "Customer"} — {property.address_line_1}, {property.city}, {property.state} {property.zip}</option>;
              })}
            </Select>
          </Field>
          {!filteredProperties.length ? <p className="text-sm text-[var(--muted-foreground)]">No properties found. <Link className="font-semibold text-[var(--primary)]" href="/admin/customers">Create a customer/property first.</Link></p> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Requested service"><Select name="serviceId"><option value="">General / custom work</option>{(services ?? []).map((service) => <option key={service.id} value={service.id}>{service.name} ({service.service_type})</option>)}</Select></Field>
            <Field label="Initial status"><Select name="status" defaultValue="scheduled"><option value="accepted">Accepted</option><option value="scheduled">Scheduled</option><option value="on_hold">On hold</option></Select></Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Scheduled date"><Input name="scheduledDate" type="date" defaultValue={params.scheduledDate ?? ""} /></Field>
            <Field label="Start time"><Input name="scheduledStartTime" type="time" defaultValue={params.scheduledStartTime ?? ""} /></Field>
            <Field label="End time"><Input name="scheduledEndTime" type="time" defaultValue={params.scheduledEndTime ?? ""} /></Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Estimated minutes"><Input name="estimatedDurationMinutes" type="number" min="15" defaultValue={params.estimatedDurationMinutes ?? 60} /></Field>
            <Field label="Required crew"><Input name="requiredCrewSize" type="number" min="1" defaultValue={params.requiredCrewSize ?? 1} /></Field>
          </div>

          <div className="grid gap-2 rounded-xl border border-[var(--border)] p-4 text-sm">
            <h2 className="font-semibold">Assign crew</h2>
            {(crew ?? []).map((member) => <label key={member.id}><input className="mr-2" type="checkbox" name="assignedCrewIds" value={member.id} />{member.name ?? member.email}</label>)}
            {crew?.length ? null : <p className="text-[var(--muted-foreground)]">No active crew profiles yet.</p>}
          </div>

          <Field label="Requested work / customer-visible notes"><Textarea name="requestedWork" placeholder="Mow front and back yard, trim fence line, blow driveway..." required /></Field>
          <Field label="Tool notes"><Textarea name="toolNotes" /></Field>
          <Field label="Safety notes"><Textarea name="safetyNotes" /></Field>
          <Field label="Internal notes"><Textarea name="internalNotes" /></Field>
          <Button type="submit">Create job</Button>
        </form>
      </Card>
    </div>
  );
}
