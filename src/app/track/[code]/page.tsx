import { getReportByTrackingCode } from "@/actions/tracking.actions";
import { TrackingPageContent } from "@/modules/track/components/TrackingPageContent";

interface TrackReportPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function TrackReportPage({
  params,
}: TrackReportPageProps) {
  const report = await getReportByTrackingCode((await params).code);

  return (
    <div>
      <TrackingPageContent
        initialCode={(await params).code}
        initialReport={report}
      />
    </div>
  );
}
