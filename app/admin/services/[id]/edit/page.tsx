import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/forms/service-form";
import { createClient } from "@/lib/supabase/server";
import { updateService } from "../../actions";

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: categories }, { data: service }] = await Promise.all([
    supabase.from("service_categories").select("id, name").order("sort_order"),
    supabase.from("services").select("*").eq("id", id).maybeSingle(),
  ]);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Edit service</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Changes affect future estimates only. Existing document line items remain unchanged.</p>
        {query.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
      </div>
      <ServiceForm action={updateService} categories={categories ?? []} service={service} submitLabel="Save service" />
    </div>
  );
}
