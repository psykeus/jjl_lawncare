import { ServiceForm } from "@/components/forms/service-form";
import { createClient } from "@/lib/supabase/server";
import { createService } from "../actions";

export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase.from("service_categories").select("id, name").order("sort_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">New service</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Create a service, add-on, exclusion, or case-by-case item.</p>
        {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
      </div>
      <ServiceForm action={createService} categories={categories ?? []} submitLabel="Create service" />
    </div>
  );
}
