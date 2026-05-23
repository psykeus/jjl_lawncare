import { roundMoney } from "@/lib/pricing/calculations";

export type EarningsInput = {
  grossRevenue: number;
  jobExpenses: number;
  equipmentReservePercent: number;
  taxSavingsReservePercent: number;
  crewMemberIds: string[];
  adjustments?: Record<string, number>;
};

export function calculateEarningsSplit(input: EarningsInput) {
  const netBeforeReserves = roundMoney(input.grossRevenue - input.jobExpenses);
  const equipmentReserve = roundMoney(netBeforeReserves * (input.equipmentReservePercent / 100));
  const taxSavingsReserve = roundMoney(netBeforeReserves * (input.taxSavingsReservePercent / 100));
  const distributableProfit = roundMoney(netBeforeReserves - equipmentReserve - taxSavingsReserve);
  const crewCount = Math.max(input.crewMemberIds.length, 1);
  const equalShare = roundMoney(distributableProfit / crewCount);

  const payouts = input.crewMemberIds.map((crewMemberId) => ({
    crewMemberId,
    amount: roundMoney(equalShare + (input.adjustments?.[crewMemberId] ?? 0)),
  }));

  return {
    grossRevenue: roundMoney(input.grossRevenue),
    jobExpenses: roundMoney(input.jobExpenses),
    netBeforeReserves,
    equipmentReserve,
    taxSavingsReserve,
    distributableProfit,
    payouts,
  };
}
