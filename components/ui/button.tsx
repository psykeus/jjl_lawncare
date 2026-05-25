import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-95",
  secondary: "bg-[var(--secondary)] text-[var(--foreground)] hover:brightness-95",
  outline: "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]",
  ghost: "text-[var(--foreground)] hover:bg-[var(--muted)]",
  danger: "bg-[var(--danger)] text-[var(--primary-foreground)] hover:brightness-95",
};

const sizes = {
  sm: "min-h-11 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-2",
  lg: "min-h-12 px-5 py-2 text-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export function ButtonLink({ className, variant = "primary", size = "md", ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
