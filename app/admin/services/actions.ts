"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { serviceFormSchema } from "@/lib/validations/service";

function parseServiceForm(formData: FormData) {
  const raw = {
    id: formData.get("id") || undefined,
    categoryId: formData.get("categoryId") || null,
    name: formData.get("name"),
    publicDescription: formData.get("publicDescription"),
    internalDescription: formData.get("internalDescription"),
    serviceType: formData.get("serviceType"),
    pricingType: formData.get("pricingType"),
    basePrice: formData.get("basePrice"),
    minPrice: formData.get("minPrice"),
    maxPrice: formData.get("maxPrice"),
    unitLabel: formData.get("unitLabel"),
    visibleToCustomer: formData.get("visibleToCustomer"),
    requiresParentApproval: formData.get("requiresParentApproval"),
    requiresPhotos: formData.get("requiresPhotos"),
    requiresSiteReview: formData.get("requiresSiteReview"),
    recurringCapable: formData.get("recurringCapable"),
    featuredOnHomepage: formData.get("featuredOnHomepage"),
    homepageTitle: formData.get("homepageTitle"),
    homepageSummary: formData.get("homepageSummary"),
    homepageSortOrder: formData.get("homepageSortOrder") || 0,
    estimatedDurationMinutes: formData.get("estimatedDurationMinutes") || 60,
    defaultCrewSize: formData.get("defaultCrewSize") || 1,
    active: formData.get("active"),
    sortOrder: formData.get("sortOrder") || 0,
  };

  const parsed = serviceFormSchema.safeParse(raw);
  if (!parsed.success) {
    redirect(`/admin/services?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid service")}`);
  }
  return parsed.data;
}

export async function createService(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseServiceForm(formData);
  const supabase = await createClient();

  const { error } = await supabase.from("services").insert({
    category_id: input.categoryId,
    name: input.name,
    public_description: input.publicDescription,
    internal_description: input.internalDescription,
    service_type: input.serviceType,
    pricing_type: input.pricingType,
    base_price: input.basePrice,
    min_price: input.minPrice,
    max_price: input.maxPrice,
    unit_label: input.unitLabel,
    visible_to_customer: input.visibleToCustomer,
    requires_parent_approval: input.requiresParentApproval,
    requires_photos: input.requiresPhotos,
    requires_site_review: input.requiresSiteReview,
    recurring_capable: input.recurringCapable,
    featured_on_homepage: input.featuredOnHomepage,
    homepage_title: input.homepageTitle,
    homepage_summary: input.homepageSummary,
    homepage_sort_order: input.homepageSortOrder,
    estimated_duration_minutes: input.estimatedDurationMinutes,
    default_crew_size: input.defaultCrewSize,
    active: input.active,
    sort_order: input.sortOrder,
  });

  if (error) redirect(`/admin/services/new?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function updateService(formData: FormData) {
  await requireRole(["admin"]);
  const input = parseServiceForm(formData);
  if (!input.id) redirect("/admin/services?error=Missing service id");

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      category_id: input.categoryId,
      name: input.name,
      public_description: input.publicDescription,
      internal_description: input.internalDescription,
      service_type: input.serviceType,
      pricing_type: input.pricingType,
      base_price: input.basePrice,
      min_price: input.minPrice,
      max_price: input.maxPrice,
      unit_label: input.unitLabel,
      visible_to_customer: input.visibleToCustomer,
      requires_parent_approval: input.requiresParentApproval,
      requires_photos: input.requiresPhotos,
      requires_site_review: input.requiresSiteReview,
      recurring_capable: input.recurringCapable,
      featured_on_homepage: input.featuredOnHomepage,
      homepage_title: input.homepageTitle,
      homepage_summary: input.homepageSummary,
      homepage_sort_order: input.homepageSortOrder,
      estimated_duration_minutes: input.estimatedDurationMinutes,
      default_crew_size: input.defaultCrewSize,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .eq("id", input.id);

  if (error) redirect(`/admin/services/${input.id}/edit?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function deactivateService(formData: FormData) {
  await requireRole(["admin"]);
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("services").update({ active: false }).eq("id", id);
  revalidatePath("/admin/services");
}
