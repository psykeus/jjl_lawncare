import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { GREATER_CINCINNATI_BOUNDS } from "@/lib/service-area/greater-cincinnati";

type PublicServiceArea = {
  id: string;
  name: string;
  area_type: string;
  cities: string[] | null;
  zip_codes: string[] | null;
  outside_area_message: string | null;
  accepts_requests: boolean;
};

async function getPublicServiceAreas() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_areas")
    .select("id, name, area_type, cities, zip_codes, outside_area_message, accepts_requests")
    .eq("active", true)
    .order("sort_order");
  return (data ?? []) as PublicServiceArea[];
}

export default async function ServiceAreaPage() {
  const areas = await getPublicServiceAreas();
  return (
    <section className="container-page space-y-6 py-12">
      <Card>
        <h1 className="text-4xl font-black">Service Area</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">
          JJL Lawn Services is focused on Greater Cincinnati and surrounding neighborhoods. The quote form checks the entered address before the request is submitted.
        </p>
      </Card>
      {areas.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {areas.map((area) => (
            <Card key={area.id}>
              <h2 className="text-xl font-bold">{area.name}</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{area.accepts_requests ? "Accepting requests" : "Internal planning only"} · {area.area_type}</p>
              {area.cities?.length ? <p className="mt-4 text-sm"><strong>Cities/neighborhoods:</strong> {area.cities.join(", ")}</p> : null}
              {area.zip_codes?.length ? <p className="mt-2 text-sm"><strong>ZIP codes:</strong> {area.zip_codes.join(", ")}</p> : null}
              {area.outside_area_message ? <p className="mt-4 text-sm text-[var(--muted-foreground)]">{area.outside_area_message}</p> : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <h2 className="text-xl font-bold">Greater Cincinnati planning area</h2>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Service-area records are not configured yet, so the app falls back to broad Greater Cincinnati map bounds: north {GREATER_CINCINNATI_BOUNDS.north}, south {GREATER_CINCINNATI_BOUNDS.south}, east {GREATER_CINCINNATI_BOUNDS.east}, west {GREATER_CINCINNATI_BOUNDS.west}.
          </p>
        </Card>
      )}
    </section>
  );
}
