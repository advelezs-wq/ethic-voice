import { getReportByTrackingCode } from "@/actions/tracking.actions";
import { TrackingPageContent } from "@/modules/track/components/TrackingPageContent";
import { ChannelShell } from "@/modules/submit/components/ChannelShell";
import { getChannelBrandingByOrgId } from "@/modules/core/utils/org-branding.server";

interface TrackReportPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function TrackReportPage({ params }: TrackReportPageProps) {
  const { code } = await params;
  const report = await getReportByTrackingCode(code);
  const branding = await getChannelBrandingByOrgId(report?.organizationId);
  const publicReport = report ? { ...report, organizationId: undefined } : report;

  return (
    <ChannelShell branding={branding}>
      <TrackingPageContent initialCode={code} initialReport={publicReport} />
    </ChannelShell>
  );
}
