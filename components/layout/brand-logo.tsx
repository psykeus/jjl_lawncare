import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({ href = "/", compact = false, className }: { href?: string; compact?: boolean; className?: string }) {
  const content = compact ? (
    <>
      <Image src="/mark.svg" alt="JJ&L Lawncare" width={40} height={40} className="h-10 w-10 rounded-xl" priority />
      <span className="sr-only">JJ&L Lawncare</span>
    </>
  ) : (
    <>
      <Image src="/mark.svg" alt="" width={40} height={40} className="h-10 w-10 rounded-xl" priority />
      <span className="grid leading-tight">
        <span className="text-base font-black tracking-tight text-[var(--foreground)]">JJ&amp;L</span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">Lawncare</span>
      </span>
    </>
  );

  return (
    <Link href={href} className={cn("focus-ring inline-flex items-center gap-2 rounded-xl", className)}>
      {content}
    </Link>
  );
}
