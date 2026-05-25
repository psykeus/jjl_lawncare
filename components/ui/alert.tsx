import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
  success: "border-[color-mix(in_srgb,var(--success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--success)_12%,var(--card))] text-[var(--foreground)]",
  warning: "border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_12%,var(--card))] text-[var(--foreground)]",
  danger: "border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_12%,var(--card))] text-[var(--foreground)]",
};

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variants;
  live?: "polite" | "assertive" | "off";
};

export function Alert({ className, variant = "default", live, role, ...props }: AlertProps) {
  const resolvedRole = role ?? (variant === "danger" ? "alert" : live && live !== "off" ? "status" : undefined);
  const ariaLive = live ?? (variant === "danger" ? "assertive" : undefined);
  return <div role={resolvedRole} aria-live={ariaLive === "off" ? undefined : ariaLive} className={cn("rounded-2xl border p-4 text-sm leading-6", variants[variant], className)} {...props} />;
}
