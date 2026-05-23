import { cn } from "@/lib/utils";

const variants = {
  default: "bg-[var(--muted)] text-[var(--foreground)]",
  success: "bg-green-50 text-[var(--success)] ring-green-200",
  warning: "bg-amber-50 text-[var(--warning)] ring-amber-200",
  danger: "bg-red-50 text-[var(--danger)] ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", variants[variant], className)}>
      {children}
    </span>
  );
}
