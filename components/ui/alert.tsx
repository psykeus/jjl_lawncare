import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
  success: "border-[color-mix(in_srgb,var(--success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--success)_12%,var(--card))] text-[var(--foreground)]",
  warning: "border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_12%,var(--card))] text-[var(--foreground)]",
  danger: "border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_12%,var(--card))] text-[var(--foreground)]",
};

export function Alert({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants }) {
  return <div className={cn("rounded-2xl border p-4 text-sm leading-6", variants[variant], className)} {...props} />;
}
