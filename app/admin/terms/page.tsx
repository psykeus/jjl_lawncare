import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { activateTermsVersion, createTermsVersion, updateTermsVersion } from "./actions";

type TermsVersion = {
  id: string;
  title: string;
  version: string;
  body: string;
  effective_date: string;
  active: boolean;
  required_for_quote_request: boolean;
  required_for_estimate_acceptance: boolean;
  created_at: string;
};

export default async function TermsManagerPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: terms } = await supabase
    .from("terms_versions")
    .select("id, title, version, body, effective_date, active, required_for_quote_request, required_for_estimate_acceptance, created_at")
    .order("effective_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Terms manager</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Create immutable-style versions and activate the version customers must accept for quote requests and estimate approvals.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Terms saved.</div> : null}
      </div>

      <div className="grid gap-4">
        {((terms ?? []) as TermsVersion[]).map((term) => (
          <Card key={term.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{term.title} v{term.version}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Effective {formatDate(term.effective_date)} · {term.active ? "Active" : "Inactive"} · Quote: {term.required_for_quote_request ? "required" : "not required"} · Estimate: {term.required_for_estimate_acceptance ? "required" : "not required"}</p>
              </div>
              {!term.active ? <form action={activateTermsVersion}><input type="hidden" name="id" value={term.id} /><input type="hidden" name="title" value={term.title} /><Button type="submit" variant="outline" size="sm">Activate</Button></form> : null}
            </div>
            <form action={updateTermsVersion} className="mt-4 grid gap-4">
              <input type="hidden" name="id" value={term.id} />
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Title"><Input name="title" defaultValue={term.title} required /></Field>
                <Field label="Version"><Input name="version" defaultValue={term.version} required /></Field>
                <Field label="Effective date"><Input name="effectiveDate" type="date" defaultValue={term.effective_date} required /></Field>
              </div>
              <Field label="Body"><Textarea name="body" className="min-h-64 font-mono" defaultValue={term.body} required /></Field>
              <div className="flex flex-wrap gap-4 text-sm">
                <label><input className="mr-2" type="checkbox" name="active" defaultChecked={term.active} /> Active</label>
                <label><input className="mr-2" type="checkbox" name="requiredForQuoteRequest" defaultChecked={term.required_for_quote_request} /> Required for quote request</label>
                <label><input className="mr-2" type="checkbox" name="requiredForEstimateAcceptance" defaultChecked={term.required_for_estimate_acceptance} /> Required for estimate acceptance</label>
              </div>
              <Button type="submit" variant="outline">Save version</Button>
            </form>
          </Card>
        ))}
        {terms?.length ? null : <Card>No terms versions yet. Create one below.</Card>}
      </div>

      <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <summary className="cursor-pointer text-xl font-bold">New terms version</summary>
        <form action={createTermsVersion} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Title"><Input name="title" defaultValue="JJL Lawn Services Terms" required /></Field>
            <Field label="Version"><Input name="version" placeholder="2026.1" required /></Field>
            <Field label="Effective date"><Input name="effectiveDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></Field>
          </div>
          <Field label="Body"><Textarea name="body" className="min-h-64 font-mono" placeholder="Paste the customer-facing terms here." required /></Field>
          <div className="flex flex-wrap gap-4 text-sm">
            <label><input className="mr-2" type="checkbox" name="active" /> Active</label>
            <label><input className="mr-2" type="checkbox" name="requiredForQuoteRequest" defaultChecked /> Required for quote request</label>
            <label><input className="mr-2" type="checkbox" name="requiredForEstimateAcceptance" defaultChecked /> Required for estimate acceptance</label>
          </div>
          <Button type="submit">Create version</Button>
        </form>
      </details>
    </div>
  );
}
