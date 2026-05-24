import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

type Category = { id: string; name: string };
type Service = {
  id?: string;
  category_id?: string | null;
  name?: string | null;
  public_description?: string | null;
  internal_description?: string | null;
  service_type?: string | null;
  pricing_type?: string | null;
  base_price?: number | string | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  unit_label?: string | null;
  visible_to_customer?: boolean | null;
  requires_parent_approval?: boolean | null;
  requires_photos?: boolean | null;
  requires_site_review?: boolean | null;
  recurring_capable?: boolean | null;
  featured_on_homepage?: boolean | null;
  homepage_title?: string | null;
  homepage_summary?: string | null;
  homepage_sort_order?: number | null;
  estimated_duration_minutes?: number | null;
  default_crew_size?: number | null;
  active?: boolean | null;
  sort_order?: number | null;
};

export function ServiceForm({
  action,
  categories,
  service,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  service?: Service | null;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      {service?.id ? <input type="hidden" name="id" value={service.id} /> : null}
      <Card className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Service name"><Input name="name" defaultValue={service?.name ?? ""} required /></Field>
          <Field label="Category">
            <Select name="categoryId" defaultValue={service?.category_id ?? ""}>
              <option value="">No category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </Field>
          <Field label="Service type">
            <Select name="serviceType" defaultValue={service?.service_type ?? "core"}>
              <option value="core">Core service</option>
              <option value="add_on">Add-on</option>
              <option value="excluded">Excluded service</option>
              <option value="case_by_case">Case-by-case</option>
            </Select>
          </Field>
          <Field label="Pricing type">
            <Select name="pricingType" defaultValue={service?.pricing_type ?? "custom_estimate"}>
              <option value="flat">Flat price</option>
              <option value="range">Price range</option>
              <option value="per_crew_hour">Per crew-hour</option>
              <option value="per_unit">Per unit</option>
              <option value="per_cubic_yard">Per cubic yard</option>
              <option value="custom_estimate">Custom estimate only</option>
            </Select>
          </Field>
        </div>
        <Field label="Public description"><Textarea name="publicDescription" defaultValue={service?.public_description ?? ""} /></Field>
        <Field label="Internal description"><Textarea name="internalDescription" defaultValue={service?.internal_description ?? ""} /></Field>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-bold">Pricing</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Base price"><Input name="basePrice" type="number" min="0" step="0.01" defaultValue={service?.base_price ?? ""} /></Field>
          <Field label="Minimum price"><Input name="minPrice" type="number" min="0" step="0.01" defaultValue={service?.min_price ?? ""} /></Field>
          <Field label="Maximum guide price"><Input name="maxPrice" type="number" min="0" step="0.01" defaultValue={service?.max_price ?? ""} /></Field>
          <Field label="Unit label"><Input name="unitLabel" defaultValue={service?.unit_label ?? ""} placeholder="bag, hour, cubic yard" /></Field>
        </div>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-bold">Public homepage card</h2>
        <label className="text-sm"><input className="mr-2" type="checkbox" name="featuredOnHomepage" defaultChecked={service?.featured_on_homepage ?? false} /> Feature on homepage</label>
        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
          <Field label="Homepage title"><Input name="homepageTitle" defaultValue={service?.homepage_title ?? ""} placeholder={service?.name ?? ""} /></Field>
          <Field label="Homepage sort"><Input name="homepageSortOrder" type="number" defaultValue={service?.homepage_sort_order ?? service?.sort_order ?? 0} /></Field>
        </div>
        <Field label="Homepage summary"><Textarea name="homepageSummary" defaultValue={service?.homepage_summary ?? ""} /></Field>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-xl font-bold">Workload defaults</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Estimated duration minutes"><Input name="estimatedDurationMinutes" type="number" min="0" defaultValue={service?.estimated_duration_minutes ?? 60} /></Field>
          <Field label="Default crew size"><Input name="defaultCrewSize" type="number" min="1" defaultValue={service?.default_crew_size ?? 1} /></Field>
        </div>
      </Card>

      <Card className="grid gap-3 text-sm">
        <h2 className="text-xl font-bold">Rules</h2>
        <label><input className="mr-2" type="checkbox" name="visibleToCustomer" defaultChecked={service?.visible_to_customer ?? true} /> Visible to customers</label>
        <label><input className="mr-2" type="checkbox" name="requiresParentApproval" defaultChecked={service?.requires_parent_approval ?? false} /> Requires parent approval</label>
        <label><input className="mr-2" type="checkbox" name="requiresPhotos" defaultChecked={service?.requires_photos ?? false} /> Requires photos</label>
        <label><input className="mr-2" type="checkbox" name="requiresSiteReview" defaultChecked={service?.requires_site_review ?? false} /> Requires site review</label>
        <label><input className="mr-2" type="checkbox" name="recurringCapable" defaultChecked={service?.recurring_capable ?? false} /> Recurring capable</label>
        <label><input className="mr-2" type="checkbox" name="active" defaultChecked={service?.active ?? true} /> Active</label>
        <Field label="Sort order"><Input name="sortOrder" type="number" defaultValue={service?.sort_order ?? 0} /></Field>
      </Card>
      <Button type="submit" size="lg">{submitLabel}</Button>
    </form>
  );
}
