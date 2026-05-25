import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { deactivateServiceArea, upsertServiceArea } from "./actions";

type ServiceArea = {
  id: string;
  name: string;
  area_type: string;
  zip_codes: string[] | null;
  cities: string[] | null;
  center_lat: number | string | null;
  center_lng: number | string | null;
  radius_miles: number | string | null;
  boundary_geojson: { north?: number; south?: number; east?: number; west?: number } | null;
  outside_area_message: string | null;
  accepts_requests: boolean;
  active: boolean;
  sort_order: number;
};

function AreaForm({ area }: { area?: ServiceArea }) {
  const bounds = area?.boundary_geojson ?? {};
  return (
    <form action={upsertServiceArea} className="grid gap-4">
      {area ? <input type="hidden" name="id" value={area.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Area name"><Input name="name" defaultValue={area?.name ?? ""} required /></Field>
        <Field label="Area type">
          <Select name="areaType" defaultValue={area?.area_type ?? "bounds"}>
            <option value="bounds">Map bounds</option>
            <option value="city">City allowlist</option>
            <option value="zip">ZIP allowlist</option>
            <option value="radius">Radius</option>
            <option value="polygon">Polygon/manual fallback</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cities" hint="Comma or line separated. Used for city allowlists and as fallback labels."><Textarea name="cities" defaultValue={(area?.cities ?? []).join("\n")} /></Field>
        <Field label="ZIP codes" hint="Comma or line separated."><Textarea name="zipCodes" defaultValue={(area?.zip_codes ?? []).join("\n")} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Center latitude"><Input name="centerLat" type="number" step="any" defaultValue={area?.center_lat ?? ""} /></Field>
        <Field label="Center longitude"><Input name="centerLng" type="number" step="any" defaultValue={area?.center_lng ?? ""} /></Field>
        <Field label="Radius miles"><Input name="radiusMiles" type="number" step="0.1" defaultValue={area?.radius_miles ?? ""} /></Field>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="North"><Input name="north" type="number" step="any" defaultValue={bounds.north ?? ""} /></Field>
        <Field label="South"><Input name="south" type="number" step="any" defaultValue={bounds.south ?? ""} /></Field>
        <Field label="East"><Input name="east" type="number" step="any" defaultValue={bounds.east ?? ""} /></Field>
        <Field label="West"><Input name="west" type="number" step="any" defaultValue={bounds.west ?? ""} /></Field>
      </div>
      <Field label="Outside-area message"><Textarea name="outsideAreaMessage" defaultValue={area?.outside_area_message ?? ""} /></Field>
      <div className="flex flex-wrap gap-4 text-sm">
        <label><input className="mr-2" type="checkbox" name="acceptsRequests" defaultChecked={area?.accepts_requests ?? true} /> Accept requests in this area</label>
        <label><input className="mr-2" type="checkbox" name="active" defaultChecked={area?.active ?? true} /> Active</label>
        <label className="flex items-center gap-2">Sort <Input className="w-24" name="sortOrder" type="number" defaultValue={area?.sort_order ?? 0} /></label>
      </div>
      <Button type="submit">{area ? "Save area" : "Add service area"}</Button>
    </form>
  );
}

export default async function AdminServiceAreasPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_areas")
    .select("id, name, area_type, zip_codes, cities, center_lat, center_lng, radius_miles, boundary_geojson, outside_area_message, accepts_requests, active, sort_order")
    .order("sort_order");
  const areas = (data ?? []) as ServiceArea[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Service areas</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Manage where customers can request work and what the internal route map should consider in-area.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Service area saved.</div> : null}
        {error ? <div className="mt-4 rounded-lg tone-warning p-3 text-sm text-[var(--warning)]">Service area table is not available yet. Apply db/migrations/005_service_areas.sql or db/setup.sql in Supabase.</div> : null}
      </div>

      <div className="grid gap-4">
        {areas.map((area) => (
          <Card key={area.id}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{area.name}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{area.area_type} · {area.active ? "Active" : "Inactive"} · {area.accepts_requests ? "Accepts requests" : "Internal only"}</p>
              </div>
              {area.active ? (
                <form action={deactivateServiceArea}>
                  <input type="hidden" name="id" value={area.id} />
                  <Button type="submit" variant="outline" size="sm">Deactivate</Button>
                </form>
              ) : null}
            </div>
            <AreaForm area={area} />
          </Card>
        ))}
        {areas.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No service areas configured yet.</p></Card>}
      </div>

      <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <summary className="cursor-pointer text-xl font-bold">Add area</summary>
        <div className="mt-4"><AreaForm /></div>
      </details>
    </div>
  );
}
