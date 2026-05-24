import { z } from "zod";

const optionalCoordinate = z.preprocess((value) => value === "" || value == null ? null : Number(value), z.number().finite().nullable()).optional();

export const quoteRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone is required"),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state"),
  zip: z.string().min(5, "ZIP is required"),
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  requestedServiceId: z.string().uuid().optional().or(z.literal("")),
  yardSize: z.string().optional(),
  grassHeight: z.string().optional(),
  debrisPresent: z.coerce.boolean().optional(),
  dogWastePresent: z.coerce.boolean().optional(),
  petsPresent: z.coerce.boolean().optional(),
  gateAccess: z.string().optional(),
  preferredDates: z.string().optional(),
  customerNotes: z.string().optional(),
  acceptedName: z.string().min(2, "Type your name to accept terms"),
  termsAccepted: z.literal("on", { error: "Terms must be accepted" }),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
