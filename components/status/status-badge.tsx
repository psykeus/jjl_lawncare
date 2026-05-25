import { Badge } from "@/components/ui/badge";

const warningStatuses = new Set(["new", "needs_review", "pending", "unpaid", "cash_pending", "venmo_pending", "completed_unpaid"]);
const successStatuses = new Set(["accepted", "scheduled", "completed", "paid", "converted", "active"]);
const dangerStatuses = new Set(["declined", "cancelled", "expired", "problem", "high", "decline"]);
const infoStatuses = new Set(["draft", "sent", "viewed", "in_progress", "on_the_way"]);

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const normalized = (status ?? "unknown").trim().toLowerCase();
  const variant = dangerStatuses.has(normalized)
    ? "danger"
    : warningStatuses.has(normalized)
      ? "warning"
      : successStatuses.has(normalized)
        ? "success"
        : infoStatuses.has(normalized)
          ? "info"
          : "neutral";

  return <Badge variant={variant}>{normalized.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</Badge>;
}
