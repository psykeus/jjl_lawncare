import { Card } from "@/components/ui/card";

const rows = [
  ["Basic Cut", "$35–$110"],
  ["Clean Cut", "$50–$140"],
  ["Yard Reset", "From $75"],
  ["Mulch Refresh", "$75–$125 per cubic yard"],
  ["Case-by-case services", "Custom estimate"],
];

export default function PricingPage() {
  return (
    <section className="container-page space-y-8 py-12">
      <div>
        <h1 className="text-4xl font-black">Pricing</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted-foreground)]">These are guide ranges. Every accepted job receives a clear estimate before scheduling.</p>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <tbody>
            {rows.map(([service, price]) => (
              <tr key={service} className="border-b border-[var(--border)] last:border-0">
                <th className="p-4 font-bold">{service}</th>
                <td className="p-4 text-[var(--muted-foreground)]">{price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
