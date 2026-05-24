import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requestServiceHref, servicePriceLabel, serviceTypeLabel, type PublicService } from "@/lib/services/display";

async function getPublicServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, public_description, service_type, pricing_type, base_price, min_price, max_price, unit_label, customer_visible_range, sort_order")
    .eq("active", true)
    .eq("visible_to_customer", true)
    .order("sort_order");
  return (data ?? []) as PublicService[];
}

function ServiceGrid({ title, services, requestable = true }: { title: string; services: PublicService[]; requestable?: boolean }) {
  if (!services.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{serviceTypeLabel(service.service_type)}</div>
                <h3 className="mt-1 font-bold">{service.name}</h3>
              </div>
              <div className="text-right text-sm font-semibold">{servicePriceLabel(service)}</div>
            </div>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">{service.public_description ?? "Final pricing depends on yard size, access, photos, and site conditions."}</p>
            {requestable ? <ButtonLink className="mt-4" href={requestServiceHref(service.id)} size="sm" variant="outline">Request this service</ButtonLink> : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

export default async function ServicesPage() {
  const services = await getPublicServices();
  const core = services.filter((service) => service.service_type === "core");
  const addOns = services.filter((service) => service.service_type === "add_on");
  const caseByCase = services.filter((service) => service.service_type === "case_by_case");
  const exclusions = services.filter((service) => service.service_type === "excluded");

  return (
    <section className="container-page space-y-8 py-12">
      <div>
        <h1 className="text-4xl font-black">Services</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">Safe, youth-appropriate lawn maintenance and light yard cleanup services. This list is managed from the admin service catalog.</p>
      </div>
      <ServiceGrid title="Core services" services={core} />
      <ServiceGrid title="Add-ons and upsells" services={addOns} />
      <ServiceGrid title="Case-by-case services" services={caseByCase} />
      {exclusions.length ? (
        <Card>
          <h2 className="text-xl font-bold">Excluded work</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {exclusions.map((service) => <div key={service.id} className="text-sm text-[var(--muted-foreground)]">• {service.name}{service.public_description ? ` — ${service.public_description}` : ""}</div>)}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
