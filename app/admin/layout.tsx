import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["admin"]);
  return <AppShell role="admin" name={profile.name}>{children}</AppShell>;
}
