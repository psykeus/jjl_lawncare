import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { archiveUserAccount, createPlatformUser, deleteUserAccount, sendPasswordResetEmail, updateUserAccess } from "./actions";

type ProfileRow = {
  id: string;
  auth_user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "customer" | "crew" | "admin";
  active: boolean;
  created_at: string;
};

type AuthUserSummary = {
  lastSignInAt: string | null;
  bannedUntil: string | null;
  createdAt: string | null;
};

function roleLabel(role: string) {
  if (role === "admin") return "Full admin";
  if (role === "crew") return "Crew";
  return "Customer";
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; archived?: string; deleted?: string; reset?: string; type?: string; q?: string }> }) {
  const params = await searchParams;
  const selectedType = params.type === "admin" || params.type === "crew" || params.type === "customer" ? params.type : "all";
  const query = (params.q ?? "").trim().toLowerCase();
  const supabase = createAdminClient();
  const [{ data: profiles }, { data: customers }, { data: jobs }, { data: activities }, authUsersResult] = await Promise.all([
    supabase.from("profiles").select("id, auth_user_id, name, email, phone, role, active, created_at").order("created_at", { ascending: false }),
    supabase.from("customers").select("id, profile_id"),
    supabase.from("jobs").select("id, assigned_crew_ids, status"),
    supabase.from("activity_log").select("actor_id, action, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const authById = new Map<string, AuthUserSummary>();
  for (const user of authUsersResult.data.users) {
    authById.set(user.id, { lastSignInAt: user.last_sign_in_at ?? null, bannedUntil: user.banned_until ?? null, createdAt: user.created_at ?? null });
  }
  const customerByProfile = new Map<string, number>();
  for (const customer of customers ?? []) if (customer.profile_id) customerByProfile.set(customer.profile_id, (customerByProfile.get(customer.profile_id) ?? 0) + 1);
  const assignedJobsByProfile = new Map<string, number>();
  const activeJobsByProfile = new Map<string, number>();
  for (const job of jobs ?? []) {
    for (const profileId of job.assigned_crew_ids ?? []) {
      assignedJobsByProfile.set(profileId, (assignedJobsByProfile.get(profileId) ?? 0) + 1);
      if (!["completed", "paid", "cancelled", "declined"].includes(job.status)) activeJobsByProfile.set(profileId, (activeJobsByProfile.get(profileId) ?? 0) + 1);
    }
  }
  const activityByProfile = new Map<string, { count: number; lastAction: string | null; lastAt: string | null }>();
  for (const activity of activities ?? []) {
    if (!activity.actor_id) continue;
    const existing = activityByProfile.get(activity.actor_id) ?? { count: 0, lastAction: null, lastAt: null };
    activityByProfile.set(activity.actor_id, { count: existing.count + 1, lastAction: existing.lastAction ?? activity.action, lastAt: existing.lastAt ?? activity.created_at });
  }

  const allRows = (profiles ?? []) as ProfileRow[];
  const typedRows = selectedType === "all" ? allRows : allRows.filter((profile) => profile.role === selectedType);
  const rows = query
    ? typedRows.filter((profile) => [profile.name, profile.email, profile.phone].some((value) => value?.toLowerCase().includes(query)))
    : typedRows;
  const totals = {
    users: allRows.length,
    active: allRows.filter((profile) => profile.active).length,
    banned: allRows.filter((profile) => !profile.active || authById.get(profile.auth_user_id)?.bannedUntil).length,
    admins: allRows.filter((profile) => profile.role === "admin" && profile.active).length,
    crew: allRows.filter((profile) => profile.role === "crew" && profile.active).length,
    customers: allRows.filter((profile) => profile.role === "customer" && profile.active).length,
  };
  const filters = [
    { label: "All", value: "all", count: totals.users, href: query ? `/admin/users?q=${encodeURIComponent(query)}` : "/admin/users" },
    { label: "Admins", value: "admin", count: allRows.filter((profile) => profile.role === "admin").length, href: `/admin/users?type=admin${query ? `&q=${encodeURIComponent(query)}` : ""}` },
    { label: "Crew", value: "crew", count: allRows.filter((profile) => profile.role === "crew").length, href: `/admin/users?type=crew${query ? `&q=${encodeURIComponent(query)}` : ""}` },
    { label: "Customers", value: "customer", count: allRows.filter((profile) => profile.role === "customer").length, href: `/admin/users?type=customer${query ? `&q=${encodeURIComponent(query)}` : ""}` },
  ];

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Administration" title="Users and access" description="Review platform accounts, send password resets, promote/demote roles, ban accounts, and monitor activity." />
      {params.error ? <Alert variant="danger">{params.error}</Alert> : null}
      {params.saved ? <Alert variant="success">User access saved.</Alert> : null}
      {params.reset ? <Alert variant="success">Password reset email sent.</Alert> : null}
      {params.archived ? <Alert variant="success">Account archived and sign-in access blocked.</Alert> : null}
      {params.deleted ? <Alert variant="success">Account deleted. Linked customer records, if any, were archived and detached.</Alert> : null}

      <StatGrid className="xl:grid-cols-6">
        <StatCard label="Users" value={totals.users} href="/admin/users" />
        <StatCard label="Active" value={totals.active} href="/admin/users" />
        <StatCard label="Banned/inactive" value={totals.banned} href="/admin/users" />
        <StatCard label="Admins" value={totals.admins} href="/admin/users?type=admin" />
        <StatCard label="Crew" value={totals.crew} href="/admin/users?type=crew" />
        <StatCard label="Customers" value={totals.customers} href="/admin/users?type=customer" />
      </StatGrid>

      <Card className="p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="font-bold">Filter users</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Showing {rows.length} of {allRows.length} account{allRows.length === 1 ? "" : "s"}.</p>
            <form className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,320px)_auto]">
              {selectedType !== "all" ? <input type="hidden" name="type" value={selectedType} /> : null}
              <Input name="q" defaultValue={params.q ?? ""} placeholder="Search name, email, or phone" aria-label="Search users" />
              <Button type="submit" variant="outline">Search</Button>
            </form>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-wrap">
            {filters.map((filter) => {
              const active = selectedType === filter.value;
              return (
                <Link key={filter.value} href={filter.href} className={`focus-ring rounded-xl border px-3 py-2 text-center text-sm font-bold transition ${active ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                  {filter.label} <span className="opacity-75">{filter.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold">Create platform user</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">For customer records with properties, use Customers. This form creates login/access only.</p>
        <form action={createPlatformUser} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Phone"><Input name="phone" /></Field>
            <Field label="Role"><Select name="role" defaultValue="customer"><option value="customer">Customer</option><option value="crew">Crew</option><option value="admin">Admin</option></Select></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <label className="text-sm font-medium"><input className="mr-2" type="checkbox" name="active" defaultChecked /> Active / allowed to sign in</label>
            <Field label="Temporary password"><Input name="password" type="text" placeholder="Optional; auto-generated if blank" /></Field>
          </div>
          <Button type="submit">Create user</Button>
        </form>
      </Card>

      <div className="grid gap-3 md:hidden">
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No {selectedType === "all" ? "" : `${selectedType} `}users found.</p></Card>}
        {rows.map((profile) => {
          const auth = authById.get(profile.auth_user_id);
          const activity = activityByProfile.get(profile.id);
          const banned = !profile.active || Boolean(auth?.bannedUntil);
          return (
            <Card key={profile.id} className="grid gap-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-black">{profile.name ?? "Unnamed"}</h2>
                  <p className="break-all text-sm text-[var(--muted-foreground)]">{profile.email}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{profile.phone ?? "No phone"}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1"><StatusBadge status={profile.role} /><StatusBadge status={banned ? "banned" : "active"} /></div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)] p-3 text-xs">
                <div>Customers: <strong>{customerByProfile.get(profile.id) ?? 0}</strong></div>
                <div>Assigned: <strong>{assignedJobsByProfile.get(profile.id) ?? 0}</strong></div>
                <div>Open jobs: <strong>{activeJobsByProfile.get(profile.id) ?? 0}</strong></div>
                <div>Activity: <strong>{activity?.count ?? 0}</strong></div>
                <div className="col-span-2">Sign-in: {formatDate(auth?.lastSignInAt)}</div>
              </div>

              <form action={sendPasswordResetEmail} className="grid gap-2 rounded-xl border border-[var(--border)] p-3">
                <input type="hidden" name="profileId" value={profile.id} />
                <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                <input type="hidden" name="email" value={profile.email ?? ""} />
                <p className="text-xs text-[var(--muted-foreground)]">Email this user a secure password reset link.</p>
                <Button type="submit" size="sm" variant="outline" disabled={!profile.email}>Send password reset</Button>
              </form>

              <form action={updateUserAccess} className="grid gap-2 rounded-xl border border-[var(--border)] p-3">
                <input type="hidden" name="profileId" value={profile.id} />
                <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                <Input name="name" defaultValue={profile.name ?? ""} aria-label="Name" required />
                <Input name="email" type="email" defaultValue={profile.email ?? ""} aria-label="Email" required />
                <Input name="phone" defaultValue={profile.phone ?? ""} aria-label="Phone" />
                <Select name="role" defaultValue={profile.role} aria-label="Role"><option value="customer">Customer</option><option value="crew">Crew</option><option value="admin">Admin</option></Select>
                <label className="text-xs"><input className="mr-2" type="checkbox" name="active" defaultChecked={profile.active && !auth?.bannedUntil} /> Active / unbanned</label>
                <Button type="submit" size="sm" variant={banned ? "primary" : "outline"}>{banned ? "Save / unban" : "Save access"}</Button>
              </form>

              <div className="grid gap-2 rounded-xl border border-[var(--border)] p-3">
                <form action={archiveUserAccount} className="grid gap-2">
                  <input type="hidden" name="profileId" value={profile.id} />
                  <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                  <Button type="submit" size="sm" variant="outline" disabled={banned}>Archive account</Button>
                </form>
                <form action={deleteUserAccount} className="grid gap-2 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] tone-danger p-2">
                  <input type="hidden" name="profileId" value={profile.id} />
                  <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                  <Input name="confirmDelete" placeholder="Type DELETE" aria-label="Type DELETE to confirm" />
                  <Button type="submit" size="sm" variant="danger">Delete account</Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-[var(--muted)]"><tr><th className="p-3">User</th><th className="p-3">Role/access</th><th className="p-3">Analytics</th><th className="p-3">Last sign-in/activity</th><th className="p-3">Update access</th><th className="p-3">Archive/delete</th></tr></thead>
          <tbody>
            {rows.map((profile) => {
              const auth = authById.get(profile.auth_user_id);
              const activity = activityByProfile.get(profile.id);
              const banned = !profile.active || Boolean(auth?.bannedUntil);
              return (
                <tr key={profile.id} className="border-t border-[var(--border)] align-top">
                  <td className="p-3"><div className="font-semibold">{profile.name ?? "Unnamed"}</div><div className="text-[var(--muted-foreground)]">{profile.email}</div><div className="text-[var(--muted-foreground)]">{profile.phone ?? "No phone"}</div><div className="mt-1 text-xs text-[var(--muted-foreground)]">Created {formatDate(auth?.createdAt ?? profile.created_at)}</div></td>
                  <td className="p-3"><div className="flex flex-wrap gap-2"><StatusBadge status={profile.role} /><StatusBadge status={banned ? "banned" : "active"} /></div><p className="mt-2 text-xs text-[var(--muted-foreground)]">{roleLabel(profile.role)}</p>{auth?.bannedUntil ? <p className="mt-1 text-xs text-[var(--danger)]">Auth banned until {formatDate(auth.bannedUntil)}</p> : null}<form action={sendPasswordResetEmail} className="mt-3"><input type="hidden" name="profileId" value={profile.id} /><input type="hidden" name="authUserId" value={profile.auth_user_id} /><input type="hidden" name="email" value={profile.email ?? ""} /><Button type="submit" size="sm" variant="outline" disabled={!profile.email}>Send password reset</Button></form></td>
                  <td className="p-3"><dl className="grid gap-1 text-xs"><div>Linked customers: <strong>{customerByProfile.get(profile.id) ?? 0}</strong></div><div>Assigned jobs: <strong>{assignedJobsByProfile.get(profile.id) ?? 0}</strong></div><div>Open crew jobs: <strong>{activeJobsByProfile.get(profile.id) ?? 0}</strong></div><div>Activity events: <strong>{activity?.count ?? 0}</strong></div></dl></td>
                  <td className="p-3 text-xs"><div>Sign-in: {formatDate(auth?.lastSignInAt)}</div><div className="mt-2">Activity: {activity?.lastAt ? `${activity.lastAction} · ${formatDate(activity.lastAt)}` : "No recorded activity"}</div></td>
                  <td className="p-3">
                    <form action={updateUserAccess} className="grid gap-2">
                      <input type="hidden" name="profileId" value={profile.id} />
                      <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                      <div className="grid gap-2 md:grid-cols-2"><Input name="name" defaultValue={profile.name ?? ""} aria-label="Name" required /><Input name="email" type="email" defaultValue={profile.email ?? ""} aria-label="Email" required /></div>
                      <div className="grid gap-2 md:grid-cols-[1fr_140px]"><Input name="phone" defaultValue={profile.phone ?? ""} aria-label="Phone" /><Select name="role" defaultValue={profile.role} aria-label="Role"><option value="customer">Customer</option><option value="crew">Crew</option><option value="admin">Admin</option></Select></div>
                      <label className="text-xs"><input className="mr-2" type="checkbox" name="active" defaultChecked={profile.active && !auth?.bannedUntil} /> Active / unbanned</label>
                      <Button type="submit" size="sm" variant={banned ? "primary" : "outline"}>{banned ? "Save / unban" : "Save access"}</Button>
                    </form>
                  </td>
                  <td className="p-3">
                    <div className="grid gap-3">
                      <form action={archiveUserAccount} className="grid gap-2 rounded-lg border border-[var(--border)] p-2">
                        <input type="hidden" name="profileId" value={profile.id} />
                        <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                        <p className="text-xs text-[var(--muted-foreground)]">Archive keeps records but blocks sign-in and archives linked customer rows.</p>
                        <Button type="submit" size="sm" variant="outline" disabled={banned}>Archive account</Button>
                      </form>
                      <form action={deleteUserAccount} className="grid gap-2 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] tone-danger p-2">
                        <input type="hidden" name="profileId" value={profile.id} />
                        <input type="hidden" name="authUserId" value={profile.auth_user_id} />
                        <p className="text-xs text-[var(--danger)]">Deletes only accounts without audit/payment/media references. Otherwise archive.</p>
                        <Input name="confirmDelete" placeholder="Type DELETE" aria-label="Type DELETE to confirm" />
                        <Button type="submit" size="sm" variant="danger">Delete account</Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length ? null : <tr><td className="p-3 text-[var(--muted-foreground)]" colSpan={6}>No users found.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
