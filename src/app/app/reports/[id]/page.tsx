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
        <main className="pt-8 sm:pt-12">
          <div className="container mx-auto max-w-[1440px] px-4 sm:px-6 py-6 sm:py-8">
            <Link
              href="/app/reports"
              className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <i
                className="icon-[bx--left-arrow-alt] size-4 group-hover:-translate-x-1 transition-transform"
                role="img"
                aria-hidden="true"
              />
              Todas las denuncias
            </Link>
            <ReportHeader report={report} parsedContent={parsedContent} />

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 sm:gap-8">
              {/* Main Content with Tabs */}
              <div className="lg:col-span-4">
                <ReportTabsContainer
                  report={report}
                  parsedContent={parsedContent}
                  reportId={reportId}
                />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-2">
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
