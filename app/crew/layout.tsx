import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(["crew", "admin"]);
  return <AppShell role="crew" name={profile.name}>{children}</AppShell>;
}
