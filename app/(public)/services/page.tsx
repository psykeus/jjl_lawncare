import { Card } from "@/components/ui/card";

const services = ["Basic Cut", "Clean Cut", "Yard Reset", "Mulch Refresh", "Flower Bed Cleanup", "Stick/Branch Cleanup"];
const exclusions = ["Tree trimming", "Chainsaw work", "Ladder/roof/gutter work", "Chemical weed killer", "Pesticides/fertilizer", "Major hauling or hazardous cleanup"];

export default function ServicesPage() {
  return (
    <section className="container-page space-y-8 py-12">
      <div>
        <h1 className="text-4xl font-black">Services</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">Safe, youth-appropriate lawn maintenance and light yard cleanup services.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => <Card key={service}><h2 className="font-bold">{service}</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">Final pricing depends on yard size, access, photos, and site conditions.</p></Card>)}
      </div>
      <Card>
        <h2 className="text-xl font-bold">Excluded work</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {exclusions.map((item) => <div key={item} className="text-sm text-[var(--muted-foreground)]">• {item}</div>)}
        </div>
      </Card>
    </section>
  );
}
