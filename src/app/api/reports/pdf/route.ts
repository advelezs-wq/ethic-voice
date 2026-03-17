import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ReportPDFFactory } from "@/modules/app/services/pdf-generator.service";
import { getAllOrganizationsStats } from "@/actions/superadmin.actions";
import { readFileSync } from "fs";
import { join } from "path";
import prisma from "@/modules/prisma/lib/prisma";
import { getFullDashboardData } from "@/modules/app/services/dashboard-data.service";

// Helper to convert image to base64
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

// Helper to fetch organization logo as base64
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

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = await auth();
    const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { reportType, filename, memberName } = body;

    if (!reportType || !filename) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get EthicVoice logo as base64
    const ethicVoiceLogo = getBase64Image("brand/logo-nobg.png");

    let pdfData: Uint8Array;

    switch (reportType) {
      case "super_admin": {
        // Fetch system-wide statistics
        const orgStats = await getAllOrganizationsStats();
        const systemStats = orgStats.systemStats;

        const data = {
          systemStats,
          ethicVoiceLogo,
          generatedBy: userId,
        };

        pdfData = await ReportPDFFactory.generateSuperAdminReport(data);
        break;
      }

      case "organization": {
        if (!orgId) {
          return NextResponse.json(
            { error: "Se requiere organización" },
            { status: 400 }
          );
        }

        // Fetch organization dashboard data using shared service (matches UI)
        const dashboardData = await getFullDashboardData(orgId);

        const organizationInfo = {
          id: orgId,
          name: body.organizationName || "Organización",
          logoUrl: body.organizationLogo || null,
        };

        // Convert organization logo to base64 if available
        const organizationLogoBase64 = await getOrganizationLogoBase64(
          organizationInfo.logoUrl
        );

        const data = {
          organization: organizationInfo,
          dashboardData,
          ethicVoiceLogo,
          organizationLogo: organizationLogoBase64,
        };

        pdfData = await ReportPDFFactory.generateOrganizationReport(data);
        break;
      }

      case "member": {
        if (!orgId) {
          return NextResponse.json(
            { error: "Se requiere organización" },
            { status: 400 }
          );
        }

        // Fetch dashboard data (org scoped) using shared service
        const dashboardData = await getFullDashboardData(orgId);

        const organizationInfo = {
          id: orgId,
          name: body.organizationName || "Organización",
          logoUrl: body.organizationLogo || null,
        };

        const organizationLogoBase64 = await getOrganizationLogoBase64(
          organizationInfo.logoUrl
        );

        const data = {
          userId,
          memberName: memberName || "Usuario",
          organization: organizationInfo,
          dashboardData,
          ethicVoiceLogo,
          organizationLogo: organizationLogoBase64,
        };

        pdfData = await ReportPDFFactory.generateMemberReport(
          data,
          memberName || "Usuario"
        );
        break;
      }

      case "report_case": {
        // For individual report case
        const reportData = body.data;
        if (!reportData) {
          return NextResponse.json(
            { error: "Report data required" },
            { status: 400 }
          );
        }

        if (!orgId) {
          return NextResponse.json(
            { error: "Organization ID required" },
            { status: 400 }
          );
        }

        // Fetch organization data to include in the report
        const organization = await prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        });

        if (!organization) {
          return NextResponse.json(
            { error: "Organization not found" },
            { status: 404 }
          );
        }

        // Convert organization logo to base64 if available
        const organizationLogoBase64 = await getOrganizationLogoBase64(
          organization.logoUrl || undefined
        );

        const data = {
          ...reportData,
          organization: {
            ...organization,
            logoUrl: organizationLogoBase64,
          },
          ethicVoiceLogo,
        };

        pdfData = await ReportPDFFactory.generateReportCasePDF(data);
        break;
      }

      case "reports_list": {
        if (!orgId) {
          return NextResponse.json(
            { error: "Organization ID required" },
            { status: 400 }
          );
        }

        // Optional filters from body; fallback to simple all reports
        const filters = body.filters || {
          status: "all",
          severity: "all",
          source: "all",
          dateRange: "all",
          assignee: "all",
        };
        const pageSize = 500; // export up to 500 rows
        const { reports } = await (
          await import("@/actions/reports.actions")
        ).getReportsWithFilters(filters, 1, pageSize);

        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });

        const data = {
          organizationName: org?.name || "",
          reports,
          ethicVoiceLogo,
        };

        pdfData = await ReportPDFFactory.generateReportsList(data as any);
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Return the PDF as a blob
    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
