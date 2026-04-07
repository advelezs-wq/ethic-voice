import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { PlatformPage } from "@/modules/landig-page/components/platform/PlatformPage";

export default function Page() {
  return (
    <MarketingPageShell>
      <PlatformPage />
    </MarketingPageShell>
  );
}
