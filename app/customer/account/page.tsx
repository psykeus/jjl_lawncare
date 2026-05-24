import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { getCurrentProfile } from "@/lib/auth/session";
import { updateCustomerAccount } from "./actions";

export default async function CustomerAccountPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Account settings</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Manage the contact details JJL Lawn Services uses for estimates and scheduling.</p>
        {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Account saved.</div> : null}
      </div>
      <Card>
        <form action={updateCustomerAccount} className="grid gap-4 max-w-xl">
          <Field label="Name"><Input name="name" defaultValue={profile?.name ?? ""} required /></Field>
          <Field label="Email"><Input value={profile?.email ?? ""} disabled /></Field>
          <Field label="Phone"><Input name="phone" defaultValue={profile?.phone ?? ""} /></Field>
          <Button type="submit">Save account</Button>
        </form>
      </Card>
    </div>
  );
}
