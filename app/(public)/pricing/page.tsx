import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requestServiceHref, servicePriceLabel, serviceTypeLabel, type PublicService } from "@/lib/services/display";

async function getPublicPricingRows() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, public_description, service_type, pricing_type, base_price, min_price, max_price, unit_label, customer_visible_range, sort_order")
    .eq("active", true)
    .eq("visible_to_customer", true)
    .neq("service_type", "excluded")
    .order("sort_order");
  return (data ?? []) as PublicService[];
}

export default async function PricingPage() {
  const rows = await getPublicPricingRows();
  return (
    <section className="container-page space-y-8 py-12">
      <div>
        <h1 className="text-4xl font-black">Pricing</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">These guide ranges come from the admin-managed service catalog. Every accepted job receives a clear estimate before scheduling.</p>
      </div>
      <div className="grid gap-3 md:hidden">
        {rows.map((service) => (
          <Card key={service.id} className="grid gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">{serviceTypeLabel(service.service_type)}</p>
              <h2 className="mt-1 text-xl font-bold">{service.name}</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{service.public_description}</p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--muted)] p-3">
              <span className="text-sm text-[var(--muted-foreground)]">Guide price</span>
              <strong>{servicePriceLabel(service)}</strong>
            </div>
            <ButtonLink href={requestServiceHref(service.id)} variant="outline">Request this service</ButtonLink>
          </Card>
        ))}
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">Pricing is being updated.</p></Card>}
      </div>
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-4">Service</th><th className="p-4">Type</th><th className="p-4">Guide price</th><th className="p-4">Action</th></tr></thead>
          <tbody>
            {rows.map((service) => (
              <tr key={service.id} className="border-b border-[var(--border)] last:border-0">
                <th className="p-4 font-bold">{service.name}<p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">{service.public_description}</p></th>
                <td className="p-4 text-[var(--muted-foreground)]">{serviceTypeLabel(service.service_type)}</td>
                <td className="p-4 font-semibold">{servicePriceLabel(service)}</td>
                <td className="p-4 whitespace-nowrap"><ButtonLink href={requestServiceHref(service.id)} size="sm" variant="outline">Request</ButtonLink></td>
              </tr>
            ))}
            {rows.length ? null : <tr><td className="p-4 text-[var(--muted-foreground)]" colSpan={4}>Pricing is being updated.</td></tr>}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
