import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  hint,
  href,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--muted-foreground)] sm:text-xs">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight sm:mt-2 sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 line-clamp-2 text-[0.7rem] leading-4 text-[var(--muted-foreground)] sm:text-xs">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "focus-ring rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-[var(--card-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--muted)] hover:shadow-md sm:p-4",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <Card className={cn("p-3 sm:p-4", className)}>{content}</Card>;
}
