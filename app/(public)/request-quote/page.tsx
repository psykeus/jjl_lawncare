import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { submitQuoteRequest } from "./actions";

export default function RequestQuotePage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  return <RequestQuoteContent searchParams={searchParams} />;
}

async function RequestQuoteContent({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const params = await searchParams;
  const services = await getVisibleServices();

  if (params.submitted) {
    return (
      <section className="container-page py-12">
        <Card>
          <h1 className="text-3xl font-black">Quote request received</h1>
          <p className="mt-3 text-[var(--muted-foreground)]">Thanks. The crew/admin team will review your request and follow up with an estimate or questions.</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="container-page max-w-3xl py-12">
      <Card>
        <h1 className="text-4xl font-black">Request a quote</h1>
        <p className="mt-3 text-[var(--muted-foreground)]">Tell us what you need. Photos can be added after the database/storage setup is connected.</p>
        {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-[var(--danger)]">{params.error}</div> : null}
        <form action={submitQuoteRequest} encType="multipart/form-data" className="mt-8 grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Phone"><Input name="phone" required /></Field>
            <Field label="Service requested">
              <Select name="requestedServiceId">
                <option value="">Not sure / choose later</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Address line 1"><Input name="addressLine1" required /></Field>
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_90px_120px]">
            <Field label="Address line 2"><Input name="addressLine2" /></Field>
            <Field label="City"><Input name="city" required /></Field>
            <Field label="State"><Input name="state" maxLength={2} required /></Field>
            <Field label="ZIP"><Input name="zip" required /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Yard size"><Input name="yardSize" placeholder="Small, medium, large, not sure" /></Field>
            <Field label="Grass height"><Input name="grassHeight" placeholder="Normal, tall, overgrown" /></Field>
          </div>
          <div className="grid gap-3 rounded-xl border border-[var(--border)] p-4 text-sm">
            <label><input className="mr-2" type="checkbox" name="debrisPresent" /> Debris/sticks present</label>
            <label><input className="mr-2" type="checkbox" name="dogWastePresent" /> Dog waste present</label>
            <label><input className="mr-2" type="checkbox" name="petsPresent" /> Pets on property</label>
          </div>
          <Field label="Gate/access notes"><Textarea name="gateAccess" /></Field>
          <Field label="Preferred dates"><Input name="preferredDates" placeholder="Example: next Saturday morning" /></Field>
          <Field label="Customer notes"><Textarea name="customerNotes" /></Field>
          <Field label="Photos" hint="Optional. Upload up to 6 photos of the yard or cleanup area.">
            <Input name="photos" type="file" accept="image/*" multiple />
          </Field>
          <div className="grid gap-3 rounded-xl bg-[var(--muted)] p-4 text-sm">
            <label><input className="mr-2" type="checkbox" name="termsAccepted" required /> I accept the quote request terms and understand unsafe/out-of-scope jobs may be declined.</label>
            <Field label="Type your name to accept terms"><Input name="acceptedName" required /></Field>
          </div>
          <Button type="submit" size="lg">Submit quote request</Button>
        </form>
      </Card>
    </section>
  );
}

async function getVisibleServices() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name")
    .eq("active", true)
    .eq("visible_to_customer", true)
    .neq("service_type", "excluded")
    .order("sort_order");
  return data ?? [];
}
