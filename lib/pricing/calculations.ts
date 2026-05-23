export type LineItemInput = {
  quantity: number;
  unitPrice: number;
  taxable?: boolean;
  itemType?: "service" | "add_on" | "material" | "discount" | "tax" | "custom";
};

export type TotalsInput = {
  items: LineItemInput[];
  taxEnabled: boolean;
  taxRate: number;
};

export function calculateLineTotal(item: LineItemInput) {
  const total = item.quantity * item.unitPrice;
  return item.itemType === "discount" ? -Math.abs(total) : total;
}

export function calculateDocumentTotals({ items, taxEnabled, taxRate }: TotalsInput) {
  const lineTotals = items.map(calculateLineTotal);
  const subtotal = lineTotals.reduce((sum, value) => sum + value, 0);
  const discountTotal = Math.abs(
    items.filter((item) => item.itemType === "discount").reduce((sum, item) => sum + calculateLineTotal(item), 0),
  );
  const taxableTotal = items
    .filter((item) => item.taxable && item.itemType !== "discount")
    .reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const taxTotal = taxEnabled ? roundMoney(taxableTotal * taxRate) : 0;
  const total = roundMoney(subtotal + taxTotal);

  return {
    subtotal: roundMoney(subtotal),
    discountTotal: roundMoney(discountTotal),
    taxTotal,
    total,
  };
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
