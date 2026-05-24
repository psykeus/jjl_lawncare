import { cn } from "@/lib/utils";

const variants = {
  success: "tone-success text-[var(--success)] ring-[color-mix(in_srgb,var(--success)_30%,var(--border))]",
  warning: "tone-warning text-[var(--warning)] ring-[color-mix(in_srgb,var(--warning)_30%,var(--border))]",
  danger: "tone-danger text-[var(--danger)] ring-[color-mix(in_srgb,var(--danger)_30%,var(--border))]",
  info: "tone-info text-[var(--info)] ring-[color-mix(in_srgb,var(--info)_30%,var(--border))]",
  neutral: "bg-[var(--muted)] text-[var(--muted-foreground)] ring-[var(--border)]",
};

export function Badge({ children, variant = "neutral" }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1", variants[variant])}>{children}</span>;
}
