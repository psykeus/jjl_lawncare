import { Card } from "@/components/ui/card";

export default function ServiceAreaPage() {
  return (
    <section className="container-page py-12">
      <Card>
        <h1 className="text-4xl font-black">Service Area</h1>
        <p className="mt-4 max-w-2xl text-[var(--muted-foreground)]">
          The crew serves nearby neighborhoods only. Requests outside the configured service area require parent/admin approval before an estimate can be sent.
        </p>
      </Card>
    </section>
  );
}
