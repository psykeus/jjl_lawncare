import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <section className="container-page py-12">
      <Card>
        <h1 className="text-4xl font-black">Contact</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">The fastest way to get started is to send a quote request with your address, notes, and photos.</p>
        <ButtonLink href="/request-quote" className="mt-6">Request a quote</ButtonLink>
      </Card>
    </section>
  );
}
