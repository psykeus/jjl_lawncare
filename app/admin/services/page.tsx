import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/status/status-badge";
import { deactivateService } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, service_type, pricing_type, min_price, max_price, base_price, active, visible_to_customer")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog & Site"
        title="Services & pricing"
        description="Editable catalog for services, add-ons, exclusions, and case-by-case work."
        actions={
          <>
            <ButtonLink href="/admin/services/new">New service</ButtonLink>
            <ButtonLink href="/admin/settings" variant="outline">Settings</ButtonLink>
          </>
        }
      />
      {params.error ? <Alert variant="danger">{params.error}</Alert> : null}
      <div className="grid gap-3 md:hidden">
        {(services ?? []).map((service) => (
          <Card key={service.id} className="grid gap-3 p-4">
            <div className="flex items-start justify-between gap-3"><div><Link href={`/admin/services/${service.id}/edit`} className="font-black text-[var(--primary)]">{service.name}</Link><p className="mt-1 text-sm text-[var(--muted-foreground)]">{service.service_type} · {service.pricing_type}</p></div><StatusBadge status={service.active ? "active" : "inactive"} /></div>
            <p className="rounded-xl bg-[var(--muted)] p-3 text-sm font-semibold">{service.min_price ? formatCurrency(Number(service.min_price)) : ""}{service.max_price ? `–${formatCurrency(Number(service.max_price))}` : service.base_price ? formatCurrency(Number(service.base_price)) : "No price set"}</p>
            <p className="text-sm text-[var(--muted-foreground)]">Customer visible: {service.visible_to_customer ? "Yes" : "No"}</p>
            <div className="grid grid-cols-3 gap-2"><ButtonLink href={`/admin/services/${service.id}/edit`} size="sm" variant="outline">Edit</ButtonLink><ButtonLink href={`/admin/services/${service.id}/questions`} size="sm" variant="outline">Questions</ButtonLink><ButtonLink href={`/admin/services/${service.id}/upsells`} size="sm" variant="outline">Upsells</ButtonLink></div>
          </Card>
        ))}
      </div>
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-[var(--muted)]">
            <tr><th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Pricing</th><th className="p-3">Visible</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {(services ?? []).map((service) => (
              <tr key={service.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-semibold"><Link href={`/admin/services/${service.id}/edit`}>{service.name}</Link></td>
                <td className="p-3">{service.service_type}</td>
                <td className="p-3">{service.pricing_type} {service.min_price ? ` ${formatCurrency(Number(service.min_price))}` : ""}{service.max_price ? `–${formatCurrency(Number(service.max_price))}` : service.base_price ? ` ${formatCurrency(Number(service.base_price))}` : ""}</td>
                <td className="p-3">{service.visible_to_customer ? "Yes" : "No"}</td>
                <td className="p-3"><StatusBadge status={service.active ? "active" : "inactive"} /></td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href={`/admin/services/${service.id}/edit`} size="sm" variant="outline">Edit</ButtonLink>
                    <ButtonLink href={`/admin/services/${service.id}/questions`} size="sm" variant="outline">Questions</ButtonLink>
                    <ButtonLink href={`/admin/services/${service.id}/upsells`} size="sm" variant="outline">Upsells</ButtonLink>
                    {service.active ? (
                      <form action={deactivateService}>
                        <input type="hidden" name="id" value={service.id} />
                        <Button type="submit" size="sm" variant="ghost">Deactivate</Button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
