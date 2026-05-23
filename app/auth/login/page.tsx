import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { signInWithPassword } from "@/lib/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="container-page flex min-h-screen max-w-md items-center py-12">
      <Card className="w-full">
        <h1 className="text-3xl font-black">Log in</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Access customer, crew, or admin tools.</p>
        {params.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        {params.message ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-[var(--success)]">{params.message}</div> : null}
        <form action={signInWithPassword} className="mt-6 grid gap-4">
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Password"><Input name="password" type="password" required /></Field>
          <Button type="submit">Log in</Button>
        </form>
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">New customer? <Link className="font-semibold text-[var(--primary)]" href="/auth/signup">Create an account</Link></p>
      </Card>
    </main>
  );
}
