import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requestServiceHref, servicePriceLabel, type PublicService } from "@/lib/services/display";

async function getHomepageServices() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, public_description, service_type, pricing_type, base_price, min_price, max_price, unit_label, customer_visible_range, sort_order")
    .eq("active", true)
    .eq("visible_to_customer", true)
    .neq("service_type", "excluded")
    .order("sort_order")
    .limit(6);
  return (data ?? []) as PublicService[];
}

export default async function HomePage() {
  const services = await getHomepageServices();
  const coreServices = services.filter((service) => service.service_type === "core").slice(0, 4);
  const handled = services.length ? services.slice(0, 5).map((service) => service.name) : ["Lawn mowing, trimming, and blowing clippings", "Flower bed and seasonal yard cleanup", "Stick pickup and light debris bagging", "Mulch spreading and walkway sweeping", "Clear exclusions for unsafe work"];

  return (
    <>
      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <Badge variant="success">Student-run lawn help</Badge>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Simple lawn mowing and light yard cleanup from a local student crew.
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted-foreground)]">
            Request a quote, approve a clear estimate, and pay by cash or Venmo after the work is complete.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/request-quote" size="lg">Request a quote</ButtonLink>
            <ButtonLink href="/services" variant="outline" size="lg">View services</ButtonLink>
          </div>
        </div>
        <Card className="space-y-4">
          <h2 className="text-2xl font-bold">What we handle</h2>
          <ul className="grid gap-3 text-sm text-[var(--muted-foreground)]">
            {handled.map((item) => <li key={item}>✓ {item}</li>)}
          </ul>
        </Card>
      </section>

      {coreServices.length ? (
        <section className="bg-white py-12">
          <div className="container-page space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Popular services</h2>
                <p className="mt-2 text-[var(--muted-foreground)]">These public service cards are pulled from the admin-managed service catalog.</p>
              </div>
              <ButtonLink href="/services" variant="outline">All services</ButtonLink>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {coreServices.map((service) => (
                <Card key={service.id}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{servicePriceLabel(service)}</div>
                  <h3 className="mt-2 text-lg font-bold">{service.name}</h3>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{service.public_description ?? "Final pricing depends on yard size, access, photos, and site conditions."}</p>
                  <ButtonLink className="mt-4" href={requestServiceHref(service.id)} size="sm">Request this</ButtonLink>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-12">
        <div className="container-page grid gap-4 md:grid-cols-3">
          {["Request", "Approve", "Schedule"].map((title, index) => (
            <Card key={title}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)] font-bold text-[var(--primary)]">{index + 1}</div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {index === 0 && "Tell us what you need and upload photos."}
                {index === 1 && "Review the scope, price, exclusions, and terms."}
                {index === 2 && "The crew completes the checklist and documents the work."}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
