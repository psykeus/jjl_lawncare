import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { signInWithMagicLink, signInWithPassword } from "@/lib/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="container-page flex min-h-screen max-w-md items-center py-12">
      <Card className="w-full">
        <h1 className="text-3xl font-black">Log in</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Access customer, crew, or admin tools.</p>
        {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.message ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-[var(--success)]">{params.message}</div> : null}
        <form action={signInWithMagicLink} className="mt-6 grid gap-4 rounded-xl border border-[var(--border)] p-4">
          <div>
            <h2 className="font-bold">Easy customer login</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Send a passwordless login link to your email.</p>
          </div>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <input type="hidden" name="redirectTo" value="/customer/dashboard" />
          <Button type="submit">Email me a login link</Button>
        </form>
        <form action={signInWithPassword} className="mt-6 grid gap-4">
          <div>
            <h2 className="font-bold">Password login</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">For admin, crew, or customers with a password.</p>
          </div>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Password"><Input name="password" type="password" required /></Field>
          <Button type="submit" variant="outline">Log in with password</Button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">New customer? <Link className="font-semibold text-[var(--primary)]" href="/auth/signup">Create an account</Link></p>
      </Card>
    </main>
  );
}
