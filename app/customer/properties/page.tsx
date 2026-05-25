import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { updatePropertyNotes } from "./actions";

export default async function CustomerPropertiesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, address_line_1, address_line_2, city, state, zip, gate_notes, pet_notes, hazard_notes, yard_size, access_notes, active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">My properties</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Saved property details used for estimates, scheduling, and crew notes.</p>
      </div>
      {params.error ? <Alert variant="danger">{params.error}</Alert> : null}
      {params.saved ? <Alert variant="success">Property notes updated.</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(properties ?? []).map((property) => (
          <Card key={property.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{property.address_line_1}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{property.address_line_2 ? `${property.address_line_2}, ` : ""}{property.city}, {property.state} {property.zip}</p>
              </div>
              <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs font-semibold">{property.active ? "Active" : "Inactive"}</span>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div><dt className="font-semibold">Yard size</dt><dd>{property.yard_size || "—"}</dd></div>
              <div><dt className="font-semibold">Gate/access</dt><dd className="text-[var(--muted-foreground)]">{property.gate_notes || property.access_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Pets</dt><dd className="text-[var(--muted-foreground)]">{property.pet_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Hazards</dt><dd className="text-[var(--muted-foreground)]">{property.hazard_notes || "—"}</dd></div>
              <div><dt className="font-semibold">Added</dt><dd>{formatDate(property.created_at)}</dd></div>
            </dl>
            <details className="mt-4 rounded-xl border border-[var(--border)] p-3">
              <summary className="cursor-pointer text-sm font-bold">Update crew notes</summary>
              <form action={updatePropertyNotes} className="mt-4 grid gap-3">
                <input type="hidden" name="propertyId" value={property.id} />
                <Field label="Yard size"><Input name="yardSize" defaultValue={property.yard_size ?? ""} placeholder="Small, medium, large, acreage…" /></Field>
                <Field label="Gate/access notes"><Textarea name="gateNotes" defaultValue={property.gate_notes ?? property.access_notes ?? ""} /></Field>
                <Field label="Pet notes"><Textarea name="petNotes" defaultValue={property.pet_notes ?? ""} /></Field>
                <Field label="Hazard notes"><Textarea name="hazardNotes" defaultValue={property.hazard_notes ?? ""} /></Field>
                <p className="text-xs text-[var(--muted-foreground)]">Need to change the address itself? Submit a new quote request for the new property so service-area and routing checks run again.</p>
                <Button type="submit">Save property notes</Button>
              </form>
            </details>
          </Card>
        ))}
        {properties?.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No properties are linked to your account yet. Properties are created when you submit a quote request.</p></Card>}
      </div>
    </div>
  );
}
