import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { CreateCustomerDrawer } from "./create-customer-drawer";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone, status, profiles(role, active), properties(id, address_line_1, city, state, zip)")
    .order("created_at", { ascending: false });

  const customerRows = customers ?? [];
  const activeCustomers = customerRows.filter((customer) => customer.status === "active").length;
  const loginAccounts = customerRows.filter((customer) => one(customer.profiles)).length;
  const properties = customerRows.filter((customer) => one(customer.properties)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Intake & Sales"
        title="Customers and properties"
        description="Review customers already in the system, confirm their login status, and jump straight into creating work when needed. Add forms now open only when requested."
        actions={
          <>
            <ButtonLink href="/admin/jobs/new" variant="outline">Create job</ButtonLink>
            <CreateCustomerDrawer />
          </>
        }
      />

      {params.error ? <Alert variant="danger">{params.error}</Alert> : null}
      {params.saved ? <Alert variant="success">Customer saved.</Alert> : null}

      <StatGrid>
        <StatCard label="Customers" value={customerRows.length} hint="Total records" />
        <StatCard label="Active" value={activeCustomers} hint="Available for new work" />
        <StatCard label="Properties" value={properties} hint="Mapped service locations" />
        <StatCard label="Login accounts" value={loginAccounts} hint="Portal-enabled customers" />
      </StatGrid>

      {customerRows.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {customerRows.map((customer) => {
              const property = one(customer.properties);
              const profile = one(customer.profiles);
              return (
                <Card key={customer.id} className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black">{customer.name}</h2>
                      <p className="text-sm text-[var(--muted-foreground)]">{customer.email}</p>
                      {customer.phone ? <p className="text-sm text-[var(--muted-foreground)]">{customer.phone}</p> : null}
                    </div>
                    <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-bold capitalize text-[var(--muted-foreground)]">{customer.status}</span>
                  </div>
                  <div className="rounded-xl bg-[var(--muted)] p-3 text-sm">
                    <p className="font-bold">Property</p>
                    <p className="text-[var(--muted-foreground)]">
                      {property ? `${property.address_line_1}, ${property.city}, ${property.state} ${property.zip}` : "No property on file"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--muted-foreground)]">{profile ? `${profile.role} · ${profile.active ? "active" : "inactive"}` : "No login"}</span>
                    <Link className="font-bold text-[var(--primary)]" href={`/admin/jobs/new?customerId=${customer.id}`}>Create job</Link>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Property</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {customerRows.map((customer) => {
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
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <EmptyState title="No customers yet" description="Add your first customer when you are ready. The customer list will stay at the top of this page as records are added." action={<CreateCustomerDrawer />} />
      )}
    </div>
  );
}
