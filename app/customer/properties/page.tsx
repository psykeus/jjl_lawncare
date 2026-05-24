import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function CustomerPropertiesPage() {
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
          </Card>
        ))}
        {properties?.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No properties are linked to your account yet. Properties are created when you submit a quote request.</p></Card>}
      </div>
    </div>
  );
}
