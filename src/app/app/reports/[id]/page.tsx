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
        <div className="min-h-screen bg-ev-paper">
          <main className="pt-20">
            <ReportError
              error="No se pudo procesar el contenido de la denuncia"
              showGoBack
            />
          </main>
        </div>
      );
    }

    return (
      <div>
        <main>
          <div className="mx-auto max-w-[1600px]">
            {/* Back link */}
            <Link
              href="/app/reports"
              className="ev-label mb-5 inline-flex items-center gap-1.5 text-ev-mute transition-colors hover:text-ev-night"
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
      <div className="min-h-screen bg-ev-paper">
        <main className="pt-20">
          <ReportError
            error={
              error instanceof Error
                ? error.message
                : "Error al cargar el reporte"
            }
            showGoBack
          />
        </main>
      </div>
    );
  }
}
