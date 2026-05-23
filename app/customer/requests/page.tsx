import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function Page() {
  return <PlaceholderPage title="My requests" description="Submitted quote requests and current review status." items={["New request", "Needs review", "Estimate sent", "Converted to job"]} />;
}
