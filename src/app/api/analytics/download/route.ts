/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { getUserPermissions } from "@/modules/core/utils/permissions";
import * as XLSX from "xlsx";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import handlebars from "handlebars";
import { readFileSync } from "fs";
import { join } from "path";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ReportPDFFactory,
  withPrintFallbackBanner,
} from "@/modules/app/services/pdf-generator.service";
import { getFullDashboardData } from "@/modules/app/services/dashboard-data.service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { orgId, format: outFormat, reportType } = await request.json();

    if (!orgId || !outFormat || !reportType) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // First, verify the organization exists
    const orgExists = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!orgExists) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    // Check user permissions
    const permissions = await getUserPermissions(
      userId,
      orgId,
      user?.primaryEmailAddress?.emailAddress
    );
    if (!permissions.canViewAllReports) {
      return NextResponse.json(
        { error: "No tienes permisos para descargar reportes" },
        { status: 403 }
      );
    }

    // Get enhanced analytics data
    const analyticsData = await getEnhancedAnalyticsData(orgId);
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { settings: true },
    });

    if (outFormat === "pdf") {
      const pdfResult = await generateEnhancedPDF(
        analyticsData,
        organization,
        reportType
      );

      const headers = new Headers();

      if (pdfResult.isHtml) {
        headers.set("Content-Type", "text/html; charset=utf-8");
      } else {
        headers.set("Content-Type", "application/pdf");
        headers.set(
          "Content-Disposition",
          `attachment; filename="ethicvoice-analytics-${reportType}-${
            new Date().toISOString().split("T")[0]
          }.pdf"`
        );
      }

      return new Response(pdfResult.buffer, { headers });
    } else if (outFormat === "xlsx") {
      const xlsxBuffer = await generateEnhancedXLSX(analyticsData, reportType);

      const headers = new Headers();
      headers.set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      headers.set(
        "Content-Disposition",
        `attachment; filename="ethicvoice-analytics-${reportType}-${
          new Date().toISOString().split("T")[0]
        }.xlsx"`
      );

      return new Response(xlsxBuffer, { headers });
    } else {
      return NextResponse.json(
        { error: "Formato no soportado" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error generating download:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function getEnhancedAnalyticsData(orgId: string) {
  const reports = await prisma.formSubmission.findMany({
    where: { orgId },
    include: {
      assignments: true,
      department: true,
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  // Get organization members (excluding admin)
  const organizationMembers = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          orgId: orgId,
          role: {
            not: "ADMIN",
          },
        },
      },
    },
    include: {
      memberships: {
        where: {
          orgId: orgId,
        },
      },
    },
  });

  const totalReports = reports.length;

  // Stats for overview
  const now = new Date();
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);
  const newReports = reports.filter((r) => r.submittedAt >= last30).length;
  const inProgress = reports.filter((r) => r.status === "IN_PROGRESS").length;
  const closedReports = reports.filter(
    (r) => r.status === "RESOLVED" || r.status === "CLOSED"
  ).length;
  const anonymousReports = reports.filter((r) => r.isAnonymous).length;
  const criticalReports = reports.filter(
    (r) =>
      r.aiSeverity === "HIGH" ||
      r.priority === "HIGH" ||
      r.priority === "URGENT"
  ).length;

  // Status distribution
  const statusCounts = reports.reduce(
    (acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusDistribution = Object.entries(statusCounts).map(
    ([status, count]) => ({
      status,
      count,
      percentage:
        totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
    })
  );

  // Department reports
  const departmentCounts = reports.reduce(
    (acc, report) => {
      const deptName = report.department?.name || "Sin Departamento";
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const departmentReports = Object.entries(departmentCounts).map(
    ([department, count]) => ({
      department,
      count,
    })
  );

  // Top N departments (default 5)
  const topDepartments = [...departmentReports]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Monthly trend per department (last 6 months for Top N)
  const monthKeys: string[] = [];
  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
    monthLabels.push(d.toLocaleDateString("es-ES", { month: "short" }));
  }
  const deptMonthly: Array<{ department: string; series: number[] }> =
    topDepartments.map((dept) => {
      const countsByMonth: Record<string, number> = {};
      for (const r of reports) {
        const deptName = r.department?.name || "Sin Departamento";
        if (deptName !== dept.department) continue;
        const d = new Date(r.submittedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        countsByMonth[key] = (countsByMonth[key] || 0) + 1;
      }
      return {
        department: dept.department,
        series: monthKeys.map((k) => countsByMonth[k] || 0),
      };
    });

  // Report types (severity)
  const typeCounts = reports.reduce(
    (acc, report) => {
      const severity = report.aiSeverity || "UNKNOWN";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const reportTypes = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
  }));

  // Enhanced team performance calculation
  const assignedReports = reports.filter((r) => r.assignments.length > 0);
  const resolvedReports = reports.filter(
    (r) => r.status === "RESOLVED" || r.status === "CLOSED"
  );

  // Calculate member performance (excluding super admin)
  const memberPerformance: Array<{
    investigator: string;
    email: string;
    role: string;
    assignedCount: number;
    resolvedCount: number;
    avgTime: number;
    productivityScore: number;
  }> = [];

  for (const member of organizationMembers) {
    const memberAssignments = assignedReports.filter((report) =>
      report.assignments.some((assignment) => assignment.userId === member.id)
    );

    const memberResolved = resolvedReports.filter((report) =>
      report.assignments.some((assignment) => assignment.userId === member.id)
    );

    // Calculate average resolution time for this member
    const resolvedWithTime = memberResolved.filter(
      (report) => report.processedAt && report.submittedAt
    );

    const avgTime =
      resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, report) => {
            const days = Math.floor(
              (new Date(report.processedAt!).getTime() -
                new Date(report.submittedAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return acc + days;
          }, 0) / resolvedWithTime.length
        : 0;

    // Calculate productivity score
    const productivityScore =
      memberAssignments.length > 0
        ? Math.round((memberResolved.length / memberAssignments.length) * 100)
        : 0;

    if (memberAssignments.length > 0 || memberResolved.length > 0) {
      memberPerformance.push({
        investigator:
          member.firstName && member.lastName
            ? `${member.firstName} ${member.lastName}`
            : member.email || "Usuario Desconocido",
        email: member.email || "",
        role: member.memberships[0]?.role || "MEMBER",
        assignedCount: memberAssignments.length,
        resolvedCount: memberResolved.length,
        avgTime: Math.round(avgTime),
        productivityScore,
      });
    }
  }

  // Best/Worst investigators
  const bestByProductivity = [...memberPerformance]
    .sort((a, b) => b.productivityScore - a.productivityScore)
    .slice(0, 5);
  const worstByProductivity = [...memberPerformance]
    .sort((a, b) => a.productivityScore - b.productivityScore)
    .slice(0, 5);
  const bestByAvgTime = [...memberPerformance]
    .filter((m) => Number.isFinite(m.avgTime))
    .sort((a, b) => a.avgTime - b.avgTime)
    .slice(0, 5);
  const worstByAvgTime = [...memberPerformance]
    .filter((m) => Number.isFinite(m.avgTime))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5);

  // Resolution time metrics
  const resolutionMetrics = computeResolutionMetrics(reports);

  return {
    totalReports,
    stats: {
      totalReports,
      newReports,
      inProgress,
      closedReports,
      anonymousReports,
      criticalReports,
      averageResolutionTime: resolutionMetrics.averageTime,
    },
    statusDistribution,
    departmentReports,
    topDepartments,
    deptMonthly: { months: monthLabels, series: deptMonthly },
    reportTypes,
    memberPerformance,
    bestWorst: {
      bestByProductivity,
      worstByProductivity,
      bestByAvgTime,
      worstByAvgTime,
    },
    organizationMetrics: {
      totalMembers: organizationMembers.length,
      activeMembersWithReports: memberPerformance.length,
      averageReportsPerMember:
        memberPerformance.length > 0
          ? Math.round(totalReports / memberPerformance.length)
          : 0,
      topPerformer:
        memberPerformance.sort(
          (a, b) => b.productivityScore - a.productivityScore
        )[0] || null,
    },
    reports: reports.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt,
      status: r.status,
      severity: r.aiSeverity,
      department: r.department?.name || "Sin Departamento",
      isAnonymous: r.isAnonymous,
    })),
    resolutionMetrics,
  } as any;
}

function computeResolutionMetrics(reports: Array<any>) {
  const resolvedReports = reports.filter(
    (r) => (r.status === "RESOLVED" || r.status === "CLOSED") && r.processedAt
  );

  if (resolvedReports.length === 0) {
    return {
      averageTime: 0,
      fastestResolution: 0,
      slowestResolution: 0,
      totalResolved: 0,
      timeDistribution: [
        { range: "0-7 días", count: 0, percentage: 0 },
        { range: "8-14 días", count: 0, percentage: 0 },
        { range: "15-30 días", count: 0, percentage: 0 },
        { range: "30+ días", count: 0, percentage: 0 },
      ],
      monthlyTrend: [],
    };
  }

  const resolutionTimes = resolvedReports.map((report) => {
    const submitDate = new Date(report.submittedAt);
    const resolveDate = new Date(report.processedAt!);
    return Math.floor(
      (resolveDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  });

  const averageTime = Math.round(
    resolutionTimes.reduce((sum, time) => sum + time, 0) /
      resolutionTimes.length
  );
  const fastestResolution = Math.min(...resolutionTimes);
  const slowestResolution = Math.max(...resolutionTimes);

  const distribution = {
    "0-7": resolutionTimes.filter((time) => time <= 7).length,
    "8-14": resolutionTimes.filter((time) => time > 7 && time <= 14).length,
    "15-30": resolutionTimes.filter((time) => time > 14 && time <= 30).length,
    "30+": resolutionTimes.filter((time) => time > 30).length,
  } as Record<string, number>;

  const totalResolved = resolutionTimes.length;
  const timeDistribution = [
    {
      range: "0-7 días",
      count: distribution["0-7"],
      percentage: Math.round((distribution["0-7"] / totalResolved) * 100),
    },
    {
      range: "8-14 días",
      count: distribution["8-14"],
      percentage: Math.round((distribution["8-14"] / totalResolved) * 100),
    },
    {
      range: "15-30 días",
      count: distribution["15-30"],
      percentage: Math.round((distribution["15-30"] / totalResolved) * 100),
    },
    {
      range: "30+ días",
      count: distribution["30+"],
      percentage: Math.round((distribution["30+"] / totalResolved) * 100),
    },
  ];

  // Monthly trend for last 6 months
  const monthlyTrend: Array<{ month: string; avgTime: number; count: number }> =
    [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const monthReports = resolvedReports.filter((report) => {
      const processedDate = new Date(report.processedAt!);
      return processedDate >= monthStart && processedDate <= monthEnd;
    });

    if (monthReports.length > 0) {
      const monthTimes = monthReports.map((report) => {
        const submitDate = new Date(report.submittedAt);
        const resolveDate = new Date(report.processedAt!);
        return Math.floor(
          (resolveDate.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      });
      const avgTime = Math.round(
        monthTimes.reduce((sum, time) => sum + time, 0) / monthTimes.length
      );
      monthlyTrend.push({
        month: monthStart.toLocaleDateString("es-ES", { month: "short" }),
        avgTime,
        count: monthReports.length,
      });
    } else {
      monthlyTrend.push({
        month: monthStart.toLocaleDateString("es-ES", { month: "short" }),
        avgTime: 0,
        count: 0,
      });
    }
  }

  return {
    averageTime,
    fastestResolution,
    slowestResolution,
    totalResolved,
    timeDistribution,
    monthlyTrend,
  };
}

async function generateEnhancedPDF(
  data: any,
  organization: any,
  reportType: string
) {
  // Se construye el mismo HTML con marca (logo, colores) una sola vez, y se
  // intenta renderizarlo con Puppeteer. Si Chromium no está disponible en el
  // entorno serverless, se degrada al MISMO HTML (con un aviso de impresión)
  // en vez de un reporte genérico sin estilos.
  const html = await buildAnalyticsReportHTML(data, organization, reportType);

  try {
    const pdfBuffer = await renderHtmlToPdfBuffer(html);
    return {
      buffer: pdfBuffer,
      isHtml: false,
    };
  } catch (error) {
    console.warn(
      "Puppeteer PDF generation failed, falling back to styled HTML:",
      error
    );
    return {
      buffer: Buffer.from(withPrintFallbackBanner(html), "utf-8"),
      isHtml: true,
    };
  }
}

function getBase64Image(imagePath: string): string {
  try {
    const fullPath = join(process.cwd(), "public", imagePath);
    const imageBuffer = readFileSync(fullPath);
    const base64 = imageBuffer.toString("base64");
    const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error loading image:", error);
    return "";
  }
}

async function getOrganizationLogoBase64(logoUrl?: string): Promise<string> {
  if (!logoUrl) return "";
  try {
    const response = await fetch(logoUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching organization logo:", error);
    return "";
  }
}

function loadTemplate(templateName: string): string {
  const templatePath = join(
    process.cwd(),
    "src",
    "templates",
    "reports",
    `${templateName}.hbs`
  );
  return readFileSync(templatePath, "utf-8");
}

function buildAnalyticsSectionContent(reportType: string, data: any): string {
  let content = "";

  // Index (organization overview only)
  if (reportType === "organization-overview") {
    content += `
<section class="panel" style="margin-bottom: 6mm;">
  <div class="panel-h"><h2>Índice</h2></div>
  <div class="panel-b">
    <ul>
      <li><a href="#kpis">KPIs</a></li>
      <li><a href="#team">Rendimiento del Equipo</a></li>
      <li><a href="#status">Distribución por Estado</a></li>
      <li><a href="#departments">Reportes por Departamento</a></li>
      <li><a href="#severity">Distribución por Severidad</a></li>
      <li><a href="#resolution">Tiempo de Resolución</a></li>
      <li><a href="#top-depts">Top Departamentos y Tendencia Mensual</a></li>
      <li><a href="#best-worst">Mejores y Peores Investigadores</a></li>
      <li><a href="#recent">Casos Recientes</a></li>
    </ul>
  </div>
</section>`;
  }

  // Organization overview KPIs in panels
  if (
    reportType === "organization-overview" ||
    reportType === "total-reports"
  ) {
    const top = data.organizationMetrics?.topPerformer;
    content += `
<section id="kpis" class="grid-4" style="margin-bottom: 6mm; page-break-inside: avoid;">
  <div class="panel">
    <div class="panel-h"><h2>KPIs</h2></div>
    <div class="panel-b grid-4">
      <div class="kpi"><div class="label">Nuevos</div><div class="value">${data.stats?.newReports ?? 0}</div><div class="note">últimos 30 días</div></div>
      <div class="kpi"><div class="label">En progreso</div><div class="value">${data.stats?.inProgress ?? 0}</div><div class="note">activos</div></div>
      <div class="kpi"><div class="label">Cerrados</div><div class="value">${data.stats?.closedReports ?? 0}</div><div class="note">30 días</div></div>
      <div class="kpi"><div class="label">Total</div><div class="value">${data.stats?.totalReports ?? data.totalReports ?? 0}</div><div class="note">histórico</div></div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Anonimato</h2></div>
    <div class="panel-b">
      <div class="kpi"><div class="label">Denuncias Anónimas</div><div class="value">${data.stats?.anonymousReports ?? 0}</div><div class="note">% del total</div></div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Resolución</h2></div>
    <div class="panel-b">
      <div class="kpi"><div class="label">Tiempo Promedio</div><div class="value">${data.stats?.averageResolutionTime ?? 0} días</div><div class="note">promedio histórico</div></div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Críticos</h2></div>
    <div class="panel-b">
      <div class="kpi"><div class="label">Reportes Críticos</div><div class="value">${data.stats?.criticalReports ?? 0}</div><div class="note">requieren atención</div></div>
    </div>
  </div>
</section>`;

    if (top) {
      content += `
<section class="panel" style="margin-bottom: 6mm;">
  <div class="panel-h"><h2>Top Performer</h2></div>
  <div class="panel-b">
    <table>
      <tbody>
        <tr><th style="width:45%">Nombre</th><td>${top.investigator}</td></tr>
        <tr><th>Productividad</th><td>${top.productivityScore}%</td></tr>
        <tr><th>Resueltos / Asignados</th><td>${top.resolvedCount} / ${top.assignedCount}</td></tr>
      </tbody>
    </table>
  </div>
</section>`;
    }
  }

  // Team performance table
  if (
    reportType === "team-performance" ||
    reportType === "organization-overview"
  ) {
    const rows = (data.memberPerformance || [])
      .map(
        (m: any) => `
<tr>
  <td>${m.investigator}</td>
  <td>${m.role === "ADMIN" ? "Administrador" : "Miembro"}</td>
  <td>${m.assignedCount}</td>
  <td>${m.resolvedCount}</td>
  <td>${m.avgTime}</td>
  <td>${m.productivityScore}%</td>
</tr>`
      )
      .join("");

    content += `
<section id="team" class="panel" style="margin-bottom: 6mm; page-break-before: always;">
  <div class="panel-h"><h2>Rendimiento del Equipo</h2></div>
  <div class="panel-b">
    <table>
      <thead>
        <tr>
          <th>Investigador</th>
          <th>Rol</th>
          <th>Asignados</th>
          <th>Resueltos</th>
          <th>Tiempo Prom. (días)</th>
          <th>Productividad (%)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
  }

  // Status distribution
  if (
    reportType === "status-distribution" ||
    reportType === "organization-overview"
  ) {
    const rows = (data.statusDistribution || [])
      .map(
        (s: any) => `
<tr>
  <td>${s.status}</td>
  <td>${s.count}</td>
  <td>${s.percentage}%</td>
</tr>`
      )
      .join("");

    content += `
<section id="status" class="panel" style="margin-bottom: 6mm;">
  <div class="panel-h"><h2>Distribución por Estado</h2></div>
  <div class="panel-b">
    <table>
      <thead>
        <tr>
          <th>Estado</th>
          <th>Cantidad</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
  }

  // Department reports
  if (
    reportType === "department-reports" ||
    reportType === "organization-overview"
  ) {
    const rows = (data.departmentReports || [])
      .map(
        (d: any) => `
<tr>
  <td>${d.department}</td>
  <td>${d.count}</td>
</tr>`
      )
      .join("");

    content += `
<section id="departments" class="panel" style="margin-bottom: 6mm;">
  <div class="panel-h"><h2>Reportes por Departamento</h2></div>
  <div class="panel-b">
    <table>
      <thead>
        <tr>
          <th>Departamento</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
  }

  // Top departments and monthly trend
  if (reportType === "organization-overview") {
    const topRows = (data.topDepartments || [])
      .map(
        (d: any, idx: number) =>
          `<tr><td>${idx + 1}</td><td>${d.department}</td><td>${d.count}</td></tr>`
      )
      .join("");

    const months: string[] = data.deptMonthly?.months || [];
    const trendHeader = `<tr><th>Departamento</th>${months
      .map((m: string) => `<th>${m}</th>`)
      .join("")}</tr>`;
    const trendRows = (data.deptMonthly?.series || [])
      .map(
        (s: any) =>
          `<tr><td>${s.department}</td>${s.series
            .map((v: number) => `<td>${v}</td>`)
            .join("")}</tr>`
      )
      .join("");

    content += `
<section id="top-depts" class="grid-2" style="margin-bottom: 6mm; page-break-before: always;">
  <div class="panel">
    <div class="panel-h"><h2>Top Departamentos</h2></div>
    <div class="panel-b">
      <table>
        <thead><tr><th>#</th><th>Departamento</th><th>Total</th></tr></thead>
        <tbody>${topRows}</tbody>
      </table>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Tendencia Mensual por Departamento</h2></div>
    <div class="panel-b">
      <table>
        <thead>${trendHeader}</thead>
        <tbody>${trendRows}</tbody>
      </table>
    </div>
  </div>
</section>`;
  }

  // Report types (severity)
  if (reportType === "report-types" || reportType === "organization-overview") {
    const rows = (data.reportTypes || [])
      .map(
        (r: any) => `
<tr>
  <td>${r.type}</td>
  <td>${r.count}</td>
  <td>${r.percentage}%</td>
</tr>`
      )
      .join("");

    content += `
<section id="severity" class="panel" style="margin-bottom: 6mm;">
  <div class="panel-h"><h2>Distribución por Severidad</h2></div>
  <div class="panel-b">
    <table>
      <thead>
        <tr>
          <th>Severidad</th>
          <th>Cantidad</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
  }

  // Resolution time metrics
  if (
    reportType === "resolution-time" ||
    reportType === "organization-overview"
  ) {
    const r = data.resolutionMetrics || {
      averageTime: 0,
      fastestResolution: 0,
      slowestResolution: 0,
      totalResolved: 0,
      timeDistribution: [],
      monthlyTrend: [],
    };

    const distRows = (r.timeDistribution || [])
      .map(
        (row: any) => `
<tr>
  <td>${row.range}</td>
  <td>${row.count}</td>
  <td>${row.percentage}%</td>
</tr>`
      )
      .join("");

    const trendRows = (r.monthlyTrend || [])
      .map(
        (row: any) => `
<tr>
  <td>${row.month}</td>
  <td>${row.avgTime} días</td>
  <td>${row.count}</td>
</tr>`
      )
      .join("");

    content += `
<section id="resolution" class="grid-2" style="margin-bottom: 6mm; page-break-before: always;">
  <div class="panel">
    <div class="panel-h"><h2>Tiempo de Resolución</h2></div>
    <div class="panel-b">
      <table>
        <tbody>
          <tr><th style=\"width:45%\">Tiempo Promedio</th><td>${r.averageTime} días</td></tr>
          <tr><th>Más Rápido</th><td>${r.fastestResolution} días</td></tr>
          <tr><th>Más Lento</th><td>${r.slowestResolution} días</td></tr>
          <tr><th>Casos Resueltos</th><td>${r.totalResolved}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Distribución por rangos</h2></div>
    <div class="panel-b">
      <table>
        <thead>
          <tr>
            <th>Rango</th>
            <th>Cantidad</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>${distRows}</tbody>
      </table>
    </div>
  </div>
</section>
<section class="panel">
  <div class="panel-h"><h2>Tendencia mensual</h2></div>
  <div class="panel-b">
    <table>
      <thead>
        <tr>
          <th>Mes</th>
          <th>Tiempo promedio</th>
          <th>Resueltos</th>
        </tr>
      </thead>
      <tbody>${trendRows}</tbody>
    </table>
  </div>
</section>`;
  }

  // Best/Worst investigators (organization-overview only)
  if (reportType === "organization-overview") {
    const bw = data.bestWorst || {};
    const table = (items: any[]) =>
      items
        .map(
          (m: any) => `
<tr>
  <td>${m.investigator}</td>
  <td>${m.assignedCount}</td>
  <td>${m.resolvedCount}</td>
  <td>${m.avgTime}</td>
  <td>${m.productivityScore}%</td>
</tr>`
        )
        .join("");

    content += `
<section id="best-worst" class="grid-2" style="margin-bottom: 6mm; page-break-before: always;">
  <div class="panel">
    <div class="panel-h"><h2>Mejores por Productividad</h2></div>
    <div class="panel-b">
      <table>
        <thead><tr><th>Investigador</th><th>Asignados</th><th>Resueltos</th><th>Tiempo (d)</th><th>Prod.</th></tr></thead>
        <tbody>${table(bw.bestByProductivity || [])}</tbody>
      </table>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Peores por Productividad</h2></div>
    <div class="panel-b">
      <table>
        <thead><tr><th>Investigador</th><th>Asignados</th><th>Resueltos</th><th>Tiempo (d)</th><th>Prod.</th></tr></thead>
        <tbody>${table(bw.worstByProductivity || [])}</tbody>
      </table>
    </div>
  </div>
</section>
<section class="grid-2" style="margin-bottom: 6mm;">
  <div class="panel">
    <div class="panel-h"><h2>Mejores por Tiempo Promedio</h2></div>
    <div class="panel-b">
      <table>
        <thead><tr><th>Investigador</th><th>Asignados</th><th>Resueltos</th><th>Tiempo (d)</th><th>Prod.</th></tr></thead>
        <tbody>${table(bw.bestByAvgTime || [])}</tbody>
      </table>
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><h2>Peores por Tiempo Promedio</h2></div>
    <div class="panel-b">
      <table>
        <thead><tr><th>Investigador</th><th>Asignados</th><th>Resueltos</th><th>Tiempo (d)</th><th>Prod.</th></tr></thead>
        <tbody>${table(bw.worstByAvgTime || [])}</tbody>
      </table>
    </div>
  </div>
</section>`;
  }

  // Recent cases (only for organization-overview)
  if (reportType === "organization-overview") {
    const recent = (data.reports || [])
      .slice(0, 10)
      .map(
        (r: any) => `
<tr>
  <td>${r.id}</td>
  <td>${new Date(r.submittedAt).toLocaleDateString("es-ES")}</td>
  <td>${r.status}</td>
  <td>${r.severity || ""}</td>
  <td>${r.department}</td>
  <td>${r.isAnonymous ? "Sí" : "No"}</td>
</tr>`
      )
      .join("");

    content += `
<section id="recent" class="panel" style="margin-bottom: 6mm; page-break-before: always;">
  <div class="panel-h"><h2>Casos Recientes</h2></div>
  <div class="panel-b">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Estado</th>
          <th>Severidad</th>
          <th>Departamento</th>
          <th>Anónimo</th>
        </tr>
      </thead>
      <tbody>${recent}</tbody>
    </table>
  </div>
</section>`;
  }

  return content;
}

async function buildAnalyticsReportHTML(
  data: any,
  organization: any,
  reportType: string
): Promise<string> {
  // Register needed helpers once
  handlebars.registerHelper("formatDate", function (date: Date, fmt: string) {
    try {
      return format(new Date(date), fmt, { locale: es });
    } catch {
      return new Date(date).toLocaleString("es-ES");
    }
  });

  // Use full base template to show org logo in header
  const baseTemplate = loadTemplate("base-report");

  const title = "Analítica Organizacional";
  const subtitle = `Reporte ${getReportTypeLabel(reportType)} - ${format(
    new Date(),
    "MMMM yyyy",
    { locale: es }
  )}`;
  const ethicVoiceLogo = getBase64Image("brand/logo-nobg.png");
  const organizationLogo = await getOrganizationLogoBase64(
    organization?.settings?.logoUrl || organization?.logoUrl
  );

  const templateData = {
    title,
    subtitle,
    reportId: `ANL-${Date.now()}`,
    organizationName: organization?.name || "Organización",
    organizationLogo,
    ethicVoiceLogo,
    generatedAt: new Date(),
  } as any;

  const compileBase = handlebars.compile(baseTemplate);
  const sectionContent = buildAnalyticsSectionContent(reportType, data);
  return compileBase({ ...templateData, content: sectionContent });
}

async function renderHtmlToPdfBuffer(html: string) {
  const isServerless =
    !!process.env.VERCEL || process.env.AWS_REGION !== undefined;
  const browser = await puppeteer.launch({
    headless: true,
    args: isServerless
      ? [...chromium.args]
      : [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
    executablePath: isServerless
      ? await chromium.executablePath()
      : process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();
  await page.setContent(html);

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "16mm",
      right: "16mm",
      bottom: "18mm",
      left: "16mm",
    },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      '<div style="font-size:10px; width:100%; padding:0 10mm; display:flex; justify-content:space-between; color:#666;">' +
      '<span class="date"></span>' +
      '<span class="pageNumber"></span>/<span class="totalPages"></span>' +
      "</div>",
  });

  await browser.close();

  return pdfBuffer;
}

function getReportTypeLabel(reportType: string): string {
  const labels = {
    "organization-overview": "Resumen Organizacional",
    "total-reports": "Total de Reportes",
    "team-performance": "Rendimiento del Equipo",
    "status-distribution": "Distribución por Estado",
    "department-reports": "Reportes por Departamento",
    "report-types": "Tipos de Reportes",
    "resolution-time": "Tiempo de Resolución",
  } as Record<string, string>;
  return labels[reportType] || reportType;
}

async function generateEnhancedXLSX(data: any, reportType: string) {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Métrica", "Valor"],
    ["Total de Reportes", data.totalReports],
    ["Total de Miembros", data.organizationMetrics.totalMembers],
    ["Miembros Activos", data.organizationMetrics.activeMembersWithReports],
    ["Reportes por Miembro", data.organizationMetrics.averageReportsPerMember],
    ["Fecha de Generación", new Date().toLocaleDateString("es-ES")],
    [""],
    ["Distribución por Estado", ""],
    ...data.statusDistribution.map((item: any) => [item.status, item.count]),
    [""],
    ["Reportes por Departamento", ""],
    ...data.departmentReports.map((item: any) => [item.department, item.count]),
    [""],
    ["Distribución por Severidad", ""],
    ...data.reportTypes.map((item: any) => [item.type, item.count]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

  // Team Performance sheet
  if (data.memberPerformance && data.memberPerformance.length > 0) {
    const teamData = [
      [
        "Investigador",
        "Email",
        "Rol",
        "Casos Asignados",
        "Casos Resueltos",
        "Tiempo Promedio (días)",
        "Productividad (%)",
      ],
      ...data.memberPerformance.map((member: any) => [
        member.investigator,
        member.email,
        member.role === "ADMIN" ? "Administrador" : "Miembro",
        member.assignedCount,
        member.resolvedCount,
        member.avgTime,
        member.productivityScore,
      ]),
    ];

    const teamSheet = XLSX.utils.aoa_to_sheet(teamData);
    XLSX.utils.book_append_sheet(workbook, teamSheet, "Rendimiento del Equipo");
  }

  // Resolution Time sheet
  if (data.resolutionMetrics) {
    const r = data.resolutionMetrics;

    const resolutionData = [
      ["Métrica", "Valor"],
      ["Tiempo Promedio (días)", r.averageTime],
      ["Más Rápido (días)", r.fastestResolution],
      ["Más Lento (días)", r.slowestResolution],
      ["Total Resueltos", r.totalResolved],
      [""],
      ["Distribución por Rango", "Cantidad", "%"],
      ...r.timeDistribution.map((row: any) => [
        row.range,
        row.count,
        row.percentage,
      ]),
      [""],
      ["Tendencia Mensual", "Tiempo Prom. (días)", "Resueltos"],
      ...r.monthlyTrend.map((row: any) => [row.month, row.avgTime, row.count]),
    ];

    const resSheet = XLSX.utils.aoa_to_sheet(resolutionData);
    XLSX.utils.book_append_sheet(workbook, resSheet, "Tiempo de Resolución");
  }

  // Detailed reports sheet
  if (data.reports && data.reports.length > 0) {
    const reportsData = [
      [
        "ID",
        "Fecha de Envío",
        "Estado",
        "Severidad",
        "Departamento",
        "Anónimo",
      ],
      ...data.reports.map((report: any) => [
        report.id,
        new Date(report.submittedAt).toLocaleDateString("es-ES"),
        report.status,
        report.severity,
        report.department,
        report.isAnonymous ? "Sí" : "No",
      ]),
    ];

    const reportsSheet = XLSX.utils.aoa_to_sheet(reportsData);
    XLSX.utils.book_append_sheet(workbook, reportsSheet, "Reportes Detallados");
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
