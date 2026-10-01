import { SubmitPageWrapper } from "@/modules/submit/components/SubmitPageWrapper";
import { ChannelShell } from "@/modules/submit/components/ChannelShell";

export default function SubmitPage() {
  return (
    <ChannelShell branding={null}>
      <SubmitPageWrapper />
    </ChannelShell>
  );
}
