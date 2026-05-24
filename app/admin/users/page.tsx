import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { archiveUserAccount, createPlatformUser, deleteUserAccount, updateUserAccess } from "./actions";

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

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; archived?: string; deleted?: string }> }) {
  const params = await searchParams;
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

  const rows = (profiles ?? []) as ProfileRow[];
  const totals = {
    users: rows.length,
    active: rows.filter((profile) => profile.active).length,
    banned: rows.filter((profile) => !profile.active || authById.get(profile.auth_user_id)?.bannedUntil).length,
    admins: rows.filter((profile) => profile.role === "admin" && profile.active).length,
    crew: rows.filter((profile) => profile.role === "crew" && profile.active).length,
    customers: rows.filter((profile) => profile.role === "customer" && profile.active).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Users, access rights, and analytics</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Create users, promote/demote roles, ban accounts, and monitor account activity.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.saved ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">User access saved.</div> : null}
        {params.archived ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Account archived and sign-in access blocked.</div> : null}
        {params.deleted ? <div className="mt-4 rounded-lg tone-success p-3 text-sm text-[var(--success)]">Account deleted. Linked customer records, if any, were archived and detached.</div> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card><div className="text-sm text-[var(--muted-foreground)]">Users</div><div className="mt-2 text-3xl font-black">{totals.users}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Active</div><div className="mt-2 text-3xl font-black">{totals.active}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Banned/inactive</div><div className="mt-2 text-3xl font-black">{totals.banned}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Admins</div><div className="mt-2 text-3xl font-black">{totals.admins}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Crew</div><div className="mt-2 text-3xl font-black">{totals.crew}</div></Card>
        <Card><div className="text-sm text-[var(--muted-foreground)]">Customers</div><div className="mt-2 text-3xl font-black">{totals.customers}</div></Card>
      </div>

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

      <Card className="overflow-x-auto p-0">
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
                  <td className="p-3"><div className="flex flex-wrap gap-2"><StatusBadge status={profile.role} /><StatusBadge status={banned ? "banned" : "active"} /></div><p className="mt-2 text-xs text-[var(--muted-foreground)]">{roleLabel(profile.role)}</p>{auth?.bannedUntil ? <p className="mt-1 text-xs text-[var(--danger)]">Auth banned until {formatDate(auth.bannedUntil)}</p> : null}</td>
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
