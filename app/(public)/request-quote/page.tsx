import { Card } from "@/components/ui/card";
import { getGoogleMapsBrowserKey } from "@/lib/maps/config";
import { createClient } from "@/lib/supabase/server";
import { RequestQuoteWizard, type WizardService, type WizardServiceQuestion } from "./request-quote-wizard";

export default function RequestQuotePage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string; serviceId?: string }> }) {
  return <RequestQuoteContent searchParams={searchParams} />;
}

async function RequestQuoteContent({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string; serviceId?: string }> }) {
  const params = await searchParams;
  const services = await getVisibleServicesWithQuestions();
  const googleMapsBrowserKey = getGoogleMapsBrowserKey();

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
    <section className="container-page max-w-5xl py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black">Request a quote</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">Use the guided form to check your address, choose services, answer quick service-specific questions, and upload photos for each selected service.</p>
      </div>
      <RequestQuoteWizard services={services} initialServiceId={params.serviceId} apiKey={googleMapsBrowserKey} error={params.error} />
    </section>
  );
}

async function getVisibleServicesWithQuestions(): Promise<WizardService[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) return [];
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, public_description, service_type, pricing_type, base_price, min_price, max_price, unit_label, customer_visible_range, requires_photos, requires_parent_approval, requires_site_review, sort_order")
    .eq("active", true)
    .eq("visible_to_customer", true)
    .neq("service_type", "excluded")
    .order("sort_order");

  const serviceRows = (services ?? []) as Omit<WizardService, "questions">[];
  if (!serviceRows.length) return [];

  const { data: questions, error } = await supabase
    .from("service_questions")
    .select("id, service_id, question_text, question_type, required, help_text, sort_order, service_question_options(id, question_id, label, value, price_modifier, duration_modifier_minutes, risk_modifier, requires_parent_approval, sort_order, active)")
    .in("service_id", serviceRows.map((service) => service.id))
    .eq("active", true)
    .order("sort_order");

  const questionsByService = new Map<string, WizardServiceQuestion[]>();
  if (!error) {
    for (const question of (questions ?? []) as WizardServiceQuestion[]) {
      const activeOptions = [...(question.service_question_options ?? [])]
        .filter((option) => option.active !== false)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
      questionsByService.set(question.service_id, [...(questionsByService.get(question.service_id) ?? []), { ...question, service_question_options: activeOptions }]);
    }
  }

  return serviceRows.map((service) => ({
    ...service,
    questions: (questionsByService.get(service.id) ?? []).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)),
  }));
}
