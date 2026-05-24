import { z } from "zod";

const emptyToNull = z.preprocess((value) => (value === "" ? null : value), z.string().nullable().optional());
const emptyToNumber = z.preprocess((value) => (value === "" || value == null ? null : Number(value)), z.number().nullable().optional());
const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

export const serviceFormSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(2, "Service name is required"),
  publicDescription: emptyToNull,
  internalDescription: emptyToNull,
  serviceType: z.enum(["core", "add_on", "excluded", "case_by_case"]),
  pricingType: z.enum(["flat", "range", "per_crew_hour", "per_unit", "per_cubic_yard", "custom_estimate"]),
  basePrice: emptyToNumber,
  minPrice: emptyToNumber,
  maxPrice: emptyToNumber,
  unitLabel: emptyToNull,
  visibleToCustomer: checkbox,
  requiresParentApproval: checkbox,
  requiresPhotos: checkbox,
  requiresSiteReview: checkbox,
  recurringCapable: checkbox,
  featuredOnHomepage: checkbox,
  homepageTitle: emptyToNull,
  homepageSummary: emptyToNull,
  homepageSortOrder: z.coerce.number().int().default(0),
  estimatedDurationMinutes: z.coerce.number().int().min(0).default(60),
  defaultCrewSize: z.coerce.number().int().min(1).default(1),
  active: checkbox,
  sortOrder: z.coerce.number().int().default(0),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
