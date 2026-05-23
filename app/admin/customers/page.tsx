import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createCustomerAndProperty } from "./actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone, status, profiles(role, active), properties(id, address_line_1, city, state, zip)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Customers and accounts</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Create customer records, optional login accounts, and mapped service properties.</p>
          {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
          {params.saved ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-[var(--success)]">Customer saved.</div> : null}
        </div>
        <Link className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white" href="/admin/jobs/new">Create job</Link>
      </div>

      <Card>
        <h2 className="text-xl font-bold">New customer / account</h2>
        <form action={createCustomerAndProperty} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Customer name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Phone"><Input name="phone" /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <label className="text-sm"><input className="mr-2" type="checkbox" name="createAccount" /> Create customer login account</label>
            <Field label="Temporary password"><Input name="password" type="text" placeholder="Optional; auto-generated if blank" /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.4fr_0.7fr_0.5fr_0.5fr]">
            <Field label="Address"><Input name="addressLine1" required /></Field>
            <Field label="City"><Input name="city" required /></Field>
            <Field label="State"><Input name="state" defaultValue="MO" required /></Field>
            <Field label="ZIP"><Input name="zip" required /></Field>
          </div>
          <Field label="Address line 2"><Input name="addressLine2" /></Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Yard size"><Select name="yardSize"><option value="">Unknown</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="extra_large">Extra large</option></Select></Field>
            <Field label="Gate notes"><Input name="gateNotes" /></Field>
            <Field label="Pet notes"><Input name="petNotes" /></Field>
          </div>
          <Field label="Hazard notes"><Textarea name="hazardNotes" /></Field>
          <Field label="Access notes"><Textarea name="accessNotes" /></Field>
          <Field label="Customer notes"><Textarea name="notes" /></Field>
          <Button type="submit">Create customer</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Property</th><th className="p-3">Account</th><th className="p-3">Action</th></tr></thead>
          <tbody>
            {(customers ?? []).map((customer) => {
              const property = one(customer.properties);
              const profile = one(customer.profiles);
              return (
                <tr key={customer.id} className="border-t border-[var(--border)]">
                  <td className="p-3 font-semibold">{customer.name}</td>
                  <td className="p-3">{customer.email}<br />{customer.phone}</td>
                  <td className="p-3">{property?.address_line_1 ?? "No property"}{property ? <><br />{property.city}, {property.state} {property.zip}</> : null}</td>
                  <td className="p-3">{profile ? `${profile.role} · ${profile.active ? "active" : "inactive"}` : "No login"}</td>
                  <td className="p-3"><Link className="font-semibold text-[var(--primary)]" href={`/admin/jobs/new?customerId=${customer.id}`}>Create job</Link></td>
                </tr>
              );
            })}
            {customers?.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={5}>No customers yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
