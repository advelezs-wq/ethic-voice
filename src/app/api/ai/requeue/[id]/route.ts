import { NextRequest, NextResponse } from "next/server";
import prisma from "@/modules/prisma/lib/prisma";
import { addSubmissionToQueue } from "@/modules/app/lib/queue/queue-manager";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { SubmissionSource } from "@/types/submission.types";

function verifyAdminApiKey(request: NextRequest): boolean {
  const apiKey =
    request.headers.get("x-admin-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedApiKey = process.env.ADMIN_API_KEY;
  if (!expectedApiKey) return false;
  return apiKey === expectedApiKey;
}

function toReadable(content: string): string {
  try {
    const obj = JSON.parse(content);

    // If it's an EthicVoice form payload, craft a human-readable narrative
    if (obj && (obj.questionnaire || obj.reported || obj.irregularityType)) {
      const parts: string[] = [];
      parts.push("=== REPORTE DE LÍNEA ÉTICA ===\n");

      if (obj.irregularityType) {
        parts.push(`TIPO DE IRREGULARIDAD: ${obj.irregularityType}\n`);
      }

      if (obj.reported) {
        parts.push("PERSONA REPORTADA:");
        parts.push(
          `- Nombre: ${obj.reported.firstName || ""} ${obj.reported.lastName || ""}`
        );
        if (obj.reported.department)
          parts.push(`- Departamento: ${obj.reported.department}`);
        if (obj.reported.position)
          parts.push(`- Cargo: ${obj.reported.position}`);
        parts.push("");
      }

      if (obj.questionnaire) {
        parts.push("DETALLES DEL REPORTE:");

        const q: Record<string, any> = obj.questionnaire;
        const items = (prefix: string) =>
          Object.entries(q)
            .filter(([k, v]) => k.startsWith(prefix) && v === true)
            .map(([k]) => `• ${k.replace(`${prefix}_`, "").replace(/_/g, " ")}`)
            .join("\n");

        const what = items("whatHappened");
        const how = items("howItHappened");
        if (what) {
          parts.push("\n¿Qué sucedió?");
          parts.push(what);
        }
        if (how) {
          parts.push("\n¿Cómo sucedió?");
          parts.push(how);
        }

        if (q.when) parts.push(`\n¿Cuándo sucedió?\n${q.when}`);
        if (q.where) parts.push(`\n¿Dónde sucedió?\n${q.where}`);
        if (q.additionalDetails)
          parts.push(`\nDetalles adicionales\n${q.additionalDetails}`);
      }

      return parts.join("\n");
    }

    return typeof obj === "string" ? obj : JSON.stringify(obj);
  } catch {
    return content;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isCron = request.headers.get("x-vercel-cron");
  if (!isCron && !verifyAdminApiKey(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid or missing API key" },
      { status: 401 }
    );
  }

  const submissionId = Number((await params).id);
  if (!submissionId || Number.isNaN(submissionId)) {
    return NextResponse.json(
      { error: "Invalid submission id" },
      { status: 400 }
    );
  }

  try {
    const sub = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        orgId: true,
        content: true,
        source: true,
        isAnonymous: true,
        reporterName: true,
        reporterEmail: true,
        reporterPhone: true,
      },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Plan-based gating: only allow requeue if org has AI processing (Grow/Grow Pro/Premium)
    const planInfo = await getOrganizationPlanInfo(sub.orgId);
    const canUseAi = Boolean(planInfo?.features?.hasAiProcessing && planInfo?.hasActivePlan);
    if (!canUseAi) {
      return NextResponse.json(
        { error: "AI processing not available for this organization's plan", plan: planInfo?.planType || "STARTER" },
        { status: 403 }
      );
    }

    const readable = toReadable(String(sub.content || ""));

    const job = await addSubmissionToQueue({
      orgId: sub.orgId,
      content: readable,
      source: sub.source as SubmissionSource,
      metadata: { submissionId },
      reporterInfo: {
        isAnonymous: !!sub.isAnonymous,
        name: sub.reporterName || undefined,
        email: sub.reporterEmail || undefined,
        phone: sub.reporterPhone || undefined,
      },
    });

    return NextResponse.json({ success: true, jobId: job.id, submissionId });
  } catch (error) {
    console.error("❌ [API] Requeue failed:", error);
    return NextResponse.json(
      {
        error: "Requeue failed",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
