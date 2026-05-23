import { Card } from "@/components/ui/card";

export function PlaceholderPage({ title, description, items = [] }: { title: string; description: string; items?: string[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">{description}</p>
      </div>
      <Card>
        <h2 className="text-xl font-bold">Implementation status</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Foundation screen created. Detailed CRUD/workflow behavior will be added in the next development pass.</p>
        {items.length ? <ul className="mt-4 grid gap-2 text-sm text-[var(--muted-foreground)]">{items.map((item) => <li key={item}>• {item}</li>)}</ul> : null}
      </Card>
    </div>
  );
}
