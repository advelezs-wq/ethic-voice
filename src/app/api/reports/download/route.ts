import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";
import { getReportsWithFilters } from "@/actions/reports.actions";
import { getReportsStats } from "@/actions/reports-stats";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const orgId = await (await import("@/modules/core/utils/org-resolver")).resolveOrgId();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { format, filename, filters } = body as {
      format: "csv" | "xlsx";
      filename?: string;
      filters?: Record<string, string>;
    };

    if (!format || (format !== "csv" && format !== "xlsx")) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const safeFilters = filters || {
      status: "all",
      severity: "all",
      source: "all",
      dateRange: "all",
      assignee: "all",
    };
    const normalizedFilters = {
      search: String((safeFilters as any).search || ""),
      status: String((safeFilters as any).status || "all"),
      severity: String((safeFilters as any).severity || "all"),
      source: String((safeFilters as any).source || "all"),
      dateRange: String((safeFilters as any).dateRange || "all"),
      assignee: String((safeFilters as any).assignee || "all"),
      priority: (safeFilters as any).priority,
      departmentId: (safeFilters as any).departmentId,
      reportType: (safeFilters as any).reportType,
      anonymous: (safeFilters as any).anonymous,
    };

    const pageSize = 1000;
    const { reports } = await getReportsWithFilters(
      normalizedFilters as any,
      1,
      pageSize
    );
    const stats = await getReportsStats(orgId);

    // Flatten rows for export
    const rows = reports.map((r: any) => ({
      ID: r.id
        ? `REP-${String(r.id).padStart(6, "0")}`
        : r.idTable
          ? `REP-${String(r.idTable).padStart(6, "0")}`
          : "",
      Asunto: r.subject || r.aiSummary || "",
      Categoría: r.type || r.category || "",
      Severidad: r.aiSeverity || r.priority || "",
      Estado: r.status || "",
      Departamento: r.department?.name || r.department || "",
      Asignado:
        (Array.isArray(r.assignments) && r.assignments[0]?.userName) ||
        r.assigneeName ||
        "",
      Fecha: r.submittedAt
        ? new Date(r.submittedAt).toISOString().split("T")[0]
        : "",
      Anónimo: r.isAnonymous ? "Sí" : "No",
    }));

    // Summary sheet/table (top of file)
    const extended = stats as any;
    const summary: Array<[string, string | number]> = [
      ["Total reportes", stats.totalReports],
      ["Pendientes", stats.pendingReports],
      ["En progreso", extended.inProgressReports ?? 0],
      ["Cerrados", extended.closedReports ?? stats.resolvedReports],
      ["Alta prioridad", stats.highPriorityReports],
      ["Anónimos", extended.anonymousReports ?? 0],
      ["Tiempo prom. resolución (días)", stats.averageResolutionTime],
    ];

    if (format === "csv") {
      // Build CSV with summary then a blank line then headers and rows
      const summaryCsv = summary.map(([k, v]) => `${k},${v}`).join("\n");
      const headers = Object.keys(
        rows[0] || {
          ID: "",
          Asunto: "",
          Categoría: "",
          Severidad: "",
          Estado: "",
          Departamento: "",
          Asignado: "",
          Fecha: "",
          Anónimo: "",
        }
      );
      const dataCsv = [
        headers.join(","),
        ...rows.map((r) =>
          headers.map((h) => String((r as any)[h] ?? "")).join(",")
        ),
      ].join("\n");
      const csv = `${summaryCsv}\n\n${dataCsv}`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename || "reporte-de-denuncias"}.csv"`,
        },
      });
    }

    // Excel (XLSX) with two sheets: Resumen and Reportes
    const wb = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Métrica", "Valor"],
      ...summary,
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen");

    const headers = Object.keys(
      rows[0] || {
        ID: "",
        Asunto: "",
        Categoría: "",
        Severidad: "",
        Estado: "",
        Departamento: "",
        Asignado: "",
        Fecha: "",
        Anónimo: "",
      }
    );
    const dataAoA = [
      headers,
      ...rows.map((r) => headers.map((h) => (r as any)[h] ?? "")),
    ];
    const reportsSheet = XLSX.utils.aoa_to_sheet(dataAoA);
    XLSX.utils.book_append_sheet(wb, reportsSheet, "Reportes");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer as unknown as Uint8Array, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename || "reporte-de-denuncias"}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error generating reports download:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
