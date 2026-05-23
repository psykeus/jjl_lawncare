import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
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
            <li>✓ Lawn mowing, trimming, and blowing clippings</li>
            <li>✓ Flower bed and seasonal yard cleanup</li>
            <li>✓ Stick pickup and light debris bagging</li>
            <li>✓ Mulch spreading and walkway sweeping</li>
            <li>✓ Clear exclusions for unsafe work</li>
          </ul>
        </Card>
      </section>
      <section className="bg-white py-12">
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
