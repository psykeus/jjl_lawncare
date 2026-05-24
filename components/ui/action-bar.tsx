import * as React from "react";
import { cn } from "@/lib/utils";

export function ActionBar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)} {...props} />;
}
