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
    <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-br from-[#f5f3ee] via-white to-emerald-50/20">
      <TrackingPageContent
        initialCode={(await params).code}
        initialReport={report}
      />
    </div>
  );
}
