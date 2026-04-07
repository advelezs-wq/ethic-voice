import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getReport } from "@/actions/reports.actions";
import { parseReportContent } from "@/modules/app/utils/reports";
import { ReportHeader } from "@/modules/app/components/report/ReportHeader";
import { ReportSidebar } from "@/modules/app/components/report/ReportSidebar";
import { ReportTabsContainer } from "@/modules/app/components/report/ReportTabsContainer";
import { ReportError } from "@/modules/app/components/report/ReportError";

interface ReportDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportDetailsPage({
  params,
}: ReportDetailsPageProps) {
  const reportId = parseInt((await params).id);

  if (isNaN(reportId)) {
    redirect("/app/reports");
  }

  try {
    const report = await getReport(reportId);
    const parsedContent = parseReportContent(report.content);

    if (!parsedContent) {
      return (
        <div className="min-h-screen bg-gray-50">
          <main className="pt-20">
            <ReportError
              error="No se pudo procesar el contenido del reporte"
              onGoBack={() => redirect("/app/reports")}
            />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <main className="pt-6 sm:pt-10">
          <div className="container mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Back link */}
            <Link
              href="/app/reports"
              className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
            >
              <i className="icon-[lucide--arrow-left] size-4" />
              Todas las denuncias
            </Link>

            {/* Compact header */}
            <ReportHeader report={report} parsedContent={parsedContent} />

            {/* Content layout: tabs (wider) + sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              {/* Main: tabs */}
              <div className="min-w-0">
                <ReportTabsContainer
                  report={report}
                  parsedContent={parsedContent}
                  reportId={reportId}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <ReportSidebar report={report} reportId={reportId} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="pt-20">
          <ReportError
            error={
              error instanceof Error
                ? error.message
                : "Error al cargar el reporte"
            }
            onGoBack={() => redirect("/app/reports")}
          />
        </main>
      </div>
    );
  }
}
