import { TrackingPageContent } from "@/modules/track/components/TrackingPageContent";
import { ChannelShell } from "@/modules/submit/components/ChannelShell";

export default function TrackPage() {
  return (
    <ChannelShell branding={null}>
      <TrackingPageContent />
    </ChannelShell>
  );
}
