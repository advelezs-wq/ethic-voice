import { getReportByTrackingCode } from "@/actions/tracking.actions";
import { Footer } from "@/modules/landig-page/components/layout/Footer";
import { Header } from "@/modules/landig-page/components/layout/Header";
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
    <div className="min-h-screen bg-white">
      <Header />
      <main className=" bg-gradient-to-br from-white via-gray-50 pt-20 to-blue-50/30">
        <TrackingPageContent
          initialCode={(await params).code}
          initialReport={report}
        />
      </main>
      <Footer />
    </div>
  );
}
