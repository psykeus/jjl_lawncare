import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { updateServiceUpsells } from "./actions";

export default async function ServiceUpsellsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: service }, { data: addOns }, { data: links, error }] = await Promise.all([
    supabase.from("services").select("id, name, service_type").eq("id", id).maybeSingle(),
    supabase.from("services").select("id, name, public_description, active").eq("service_type", "add_on").eq("active", true).order("sort_order"),
    supabase.from("service_upsells").select("upsell_service_id").eq("core_service_id", id).eq("active", true),
  ]);
  if (!service) notFound();
  const selected = new Set((links ?? []).map((link) => link.upsell_service_id));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/services" className="text-sm font-semibold text-[var(--primary)]">← Services</Link>
        <h1 className="mt-2 text-3xl font-black">Upsells for {service.name}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Choose which add-ons should pop up when this service is selected in the public quote wizard.</p>
        {query.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
        {query.saved ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Upsells saved.</div> : null}
        {error ? <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Service upsells table is not available yet. Apply db/migrations/008_service_catalog_planning_fields.sql.</div> : null}
      </div>
      <Card>
        <form action={updateServiceUpsells} className="grid gap-4">
          <input type="hidden" name="serviceId" value={id} />
          {(addOns ?? []).map((addOn) => (
            <label key={addOn.id} className="rounded-xl border border-[var(--border)] p-4 text-sm">
              <input className="mr-2" type="checkbox" name="upsellServiceIds" value={addOn.id} defaultChecked={selected.has(addOn.id)} />
              <strong>{addOn.name}</strong>
              {addOn.public_description ? <span className="ml-2 text-[var(--muted-foreground)]">{addOn.public_description}</span> : null}
            </label>
          ))}
          {addOns?.length ? null : <p className="text-sm text-[var(--muted-foreground)]">No active add-on services yet.</p>}
          <Button type="submit">Save upsells</Button>
        </form>
      </Card>
    </div>
  );
}
