import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p> : null}
    </Card>
  );
}
