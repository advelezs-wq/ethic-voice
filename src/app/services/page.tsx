import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { ServicesPage } from "@/modules/landig-page/components/services/ServicesPage";

export default async function Page(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await props.searchParams;
  const category = params?.category;
  return (
    <MarketingPageShell>
      <ServicesPage initialCategory={category} />
    </MarketingPageShell>
  );
}
