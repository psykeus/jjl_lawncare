import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { updatePassword } from "@/lib/auth/actions";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="container-page flex min-h-screen max-w-md items-center py-12">
      <Card className="w-full">
        <h1 className="text-2xl font-black sm:text-3xl">Set a new password</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Enter a new password for your JJ&L Lawncare account.</p>
        {params.error ? <div className="mt-4 rounded-lg tone-danger p-3 text-sm text-[var(--danger)]">{params.error}</div> : null}
        <form action={updatePassword} className="mt-6 grid gap-4">
          <Field label="New password"><Input name="password" type="password" minLength={8} required autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><Input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" /></Field>
          <Button type="submit">Update password</Button>
        </form>
      </Card>
    </main>
  );
}
