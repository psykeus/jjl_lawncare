import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["customer", "admin"]);
  return <AppShell role="customer" name={profile.name}>{children}</AppShell>;
}
