import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: terms } = await supabase
    .from("terms_versions")
    .select("title, version, body, effective_date")
    .eq("active", true)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <section className="container-page py-12">
      <Card className="prose max-w-none">
        <h1 className="text-4xl font-black">{terms?.title ?? "Terms and Conditions"}</h1>
        {terms ? <p className="mt-2 text-sm text-[var(--muted-foreground)]">Version {terms.version} · Effective {formatDate(terms.effective_date)}</p> : null}
        {terms ? (
          <div className="mt-6 whitespace-pre-wrap text-[var(--muted-foreground)]">{terms.body}</div>
        ) : (
          <ul className="mt-6 grid gap-3 text-[var(--muted-foreground)]">
            <li>Payment is due upon completion unless otherwise stated.</li>
            <li>Customers must clear toys, hoses, furniture, and hidden objects before service.</li>
            <li>Pets must be secured before the crew arrives.</li>
            <li>Unsafe or out-of-scope jobs may be declined.</li>
            <li>No chemical application, ladder, roof, tree, or chainsaw work.</li>
            <li>Before/after photos may be used for private job documentation.</li>
          </ul>
        )}
      </Card>
    </section>
  );
}
