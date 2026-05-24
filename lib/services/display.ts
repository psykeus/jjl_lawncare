import { formatCurrency } from "@/lib/utils";

export type PublicService = {
  id: string;
  name: string;
  public_description: string | null;
  service_type: string;
  pricing_type: string;
  base_price: number | null;
  min_price: number | null;
  max_price: number | null;
  unit_label: string | null;
  customer_visible_range: string | null;
  sort_order: number;
};

export function serviceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    core: "Core service",
    add_on: "Add-on",
    case_by_case: "Case-by-case",
    excluded: "Not offered",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

export function servicePriceLabel(service: Pick<PublicService, "customer_visible_range" | "pricing_type" | "base_price" | "min_price" | "max_price" | "unit_label">) {
  if (service.customer_visible_range) return service.customer_visible_range;
  if (service.base_price != null && service.pricing_type === "flat") return formatCurrency(Number(service.base_price));
  if (service.base_price != null && service.pricing_type === "per_unit") return `${formatCurrency(Number(service.base_price))}${service.unit_label ? ` / ${service.unit_label}` : " / unit"}`;
  if (service.min_price != null && service.max_price != null) return `${formatCurrency(Number(service.min_price))}–${formatCurrency(Number(service.max_price))}`;
  if (service.min_price != null) return `From ${formatCurrency(Number(service.min_price))}`;
  if (service.pricing_type === "custom_estimate") return "Custom estimate";
  return "Quoted after review";
}

export function requestServiceHref(serviceId: string) {
  return `/request-quote?serviceId=${encodeURIComponent(serviceId)}`;
}
