import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { signUpWithPassword } from "@/lib/auth/actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="container-page flex min-h-screen max-w-md items-center py-12">
      <Card className="w-full">
        <h1 className="text-3xl font-black">Create customer account</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Crew/admin accounts should be created by an admin.</p>
        {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        <form action={signUpWithPassword} className="mt-6 grid gap-4">
          <Field label="Name"><Input name="name" required /></Field>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Password"><Input name="password" type="password" minLength={8} required /></Field>
          <Button type="submit">Create account</Button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">Already have an account? <Link className="font-semibold text-[var(--primary)]" href="/auth/login">Log in</Link></p>
      </Card>
    </main>
  );
}
