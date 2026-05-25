import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createChecklistItem, createChecklistTemplate, deactivateChecklistItem, updateChecklistItem, updateChecklistTemplate } from "./actions";

type RelatedRow<T> = T | T[] | null;
function one<T>(value: RelatedRow<T>): T | null { return Array.isArray(value) ? (value[0] ?? null) : value; }

type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  sort_order: number;
  active: boolean;
};

type ChecklistTemplate = {
  id: string;
  name: string;
  service_id: string | null;
  active: boolean;
  services: RelatedRow<{ name: string }>;
  checklist_items: ChecklistItem[] | null;
};

function ServiceOptions({ services }: { services: { id: string; name: string }[] }) {
  return (
    <>
      <option value="">All/general services</option>
      {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
    </>
  );
}

export default async function ChecklistsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: templates }, { data: services }] = await Promise.all([
    supabase
      .from("checklist_templates")
      .select("id, name, service_id, active, services(name), checklist_items(id, label, required, sort_order, active)")
      .order("name"),
    supabase.from("services").select("id, name").eq("active", true).order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Checklist templates</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Create reusable service checklists. Jobs receive a snapshot at conversion time so future template edits do not rewrite past work.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Checklist saved.</div> : null}
      </div>

      <div className="grid gap-4">
        {((templates ?? []) as ChecklistTemplate[]).map((template) => {
          const service = one(template.services);
          const items = [...(template.checklist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
          return (
            <Card key={template.id}>
              <form action={updateChecklistTemplate} className="grid gap-4 md:grid-cols-[1fr_280px_auto_auto] md:items-end">
                <input type="hidden" name="id" value={template.id} />
                <Field label="Template name"><Input name="name" defaultValue={template.name} required /></Field>
                <Field label="Service"><Select name="serviceId" defaultValue={template.service_id ?? ""}><ServiceOptions services={services ?? []} /></Select></Field>
                <label className="pb-2 text-sm"><input className="mr-2" type="checkbox" name="active" defaultChecked={template.active} /> Active</label>
                <Button type="submit" variant="outline">Save template</Button>
              </form>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">Applies to: {service?.name ?? "All/general services"}</p>

              <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--muted)]"><tr><th className="p-3">Label</th><th className="p-3">Sort</th><th className="p-3">Required</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr></thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--border)] align-middle">
                        <td className="p-3">
                          <form id={`item-${item.id}`} action={updateChecklistItem} className="contents">
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="templateId" value={template.id} />
                            <Input name="label" defaultValue={item.label} required />
                          </form>
                        </td>
                        <td className="p-3"><Input form={`item-${item.id}`} className="w-24" name="sortOrder" type="number" min="0" defaultValue={item.sort_order} /></td>
                        <td className="p-3"><input form={`item-${item.id}`} type="checkbox" name="required" defaultChecked={item.required} /></td>
                        <td className="p-3"><input form={`item-${item.id}`} type="checkbox" name="active" defaultChecked={item.active} /></td>
                        <td className="p-3"><div className="flex gap-2"><Button form={`item-${item.id}`} type="submit" size="sm" variant="outline">Save</Button><form action={deactivateChecklistItem}><input type="hidden" name="id" value={item.id} /><Button type="submit" size="sm" variant="ghost">Deactivate</Button></form></div></td>
                      </tr>
                    ))}
                    <tr className="border-t border-[var(--border)] bg-[var(--card)]">
                      <td className="p-3">
                        <form id={`new-item-${template.id}`} action={createChecklistItem} className="contents">
                          <input type="hidden" name="templateId" value={template.id} />
                          <input type="hidden" name="active" value="on" />
                          <Input name="label" placeholder="Check gate is closed" required />
                        </form>
                      </td>
                      <td className="p-3"><Input form={`new-item-${template.id}`} className="w-24" name="sortOrder" type="number" min="0" defaultValue={items.length + 1} /></td>
                      <td className="p-3"><input form={`new-item-${template.id}`} type="checkbox" name="required" defaultChecked /></td>
                      <td className="p-3">Yes</td>
                      <td className="p-3"><Button form={`new-item-${template.id}`} type="submit" size="sm">Add item</Button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
        {templates?.length ? null : <Card>No checklist templates yet. Create one below.</Card>}
      </div>

      <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <summary className="cursor-pointer text-xl font-bold">New template</summary>
        <form action={createChecklistTemplate} className="mt-4 grid gap-4 md:grid-cols-[1fr_280px_auto_auto] md:items-end">
          <Field label="Name"><Input name="name" placeholder="Mowing checklist" required /></Field>
          <Field label="Service"><Select name="serviceId"><ServiceOptions services={services ?? []} /></Select></Field>
          <label className="pb-2 text-sm"><input className="mr-2" type="checkbox" name="active" defaultChecked /> Active</label>
          <Button type="submit">Create</Button>
        </form>
      </details>
    </div>
  );
}
