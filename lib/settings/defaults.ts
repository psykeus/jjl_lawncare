export type BusinessSettings = {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  serviceAreaDescription: string;
  publicIntroText: string;
  publicFooterText: string;
  businessStatus: "active" | "paused";
};

export type PaymentSettings = {
  acceptCash: boolean;
  acceptVenmo: boolean;
  venmoHandle: string;
  cashInstructions: string;
  paymentDueWording: string;
  latePaymentWording: string;
};

export type DocumentSettings = {
  estimatePrefix: string;
  invoicePrefix: string;
  startingNumber: number;
  defaultEstimateExpirationDays: number;
  defaultInvoiceDueDays: number;
  estimateFooterNote: string;
  invoiceFooterNote: string;
};

export type TaxReserveSettings = {
  salesTaxEnabled: boolean;
  salesTaxRate: number;
  salesTaxLabel: string;
  applyTaxToLabor: boolean;
  applyTaxToMaterials: boolean;
  equipmentReservePercent: number;
  taxSavingsReservePercent: number;
  defaultSplitMethod: "equal" | "custom_percentage" | "fixed_payout";
};

export const defaultBusinessSettings: BusinessSettings = {
  businessName: "JJL Lawn Services",
  contactEmail: "",
  contactPhone: "",
  serviceAreaDescription: "Nearby neighborhoods only.",
  publicIntroText: "Simple lawn mowing and light yard cleanup from a local student crew.",
  publicFooterText: "Safe, simple student-run lawn help.",
  businessStatus: "active",
};

export const defaultPaymentSettings: PaymentSettings = {
  acceptCash: true,
  acceptVenmo: true,
  venmoHandle: "",
  cashInstructions: "Cash due upon completion.",
  paymentDueWording: "Payment is due upon completion.",
  latePaymentWording: "Please send payment as soon as possible.",
};

export const defaultDocumentSettings: DocumentSettings = {
  estimatePrefix: "EST-",
  invoicePrefix: "JLC-",
  startingNumber: 1,
  defaultEstimateExpirationDays: 14,
  defaultInvoiceDueDays: 0,
  estimateFooterNote: "Thank you for considering JJL Lawn Services.",
  invoiceFooterNote: "Thank you for your business.",
};

export const defaultTaxReserveSettings: TaxReserveSettings = {
  salesTaxEnabled: false,
  salesTaxRate: 0,
  salesTaxLabel: "Sales tax",
  applyTaxToLabor: false,
  applyTaxToMaterials: false,
  equipmentReservePercent: 10,
  taxSavingsReservePercent: 15,
  defaultSplitMethod: "equal",
};

export function mergeSettings<T extends object>(defaults: T, value: unknown): T {
  return { ...defaults, ...(typeof value === "object" && value !== null ? value : {}) } as T;
}
