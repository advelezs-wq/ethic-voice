import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SubmissionSource } from "@/types/submission.types";
import { z } from "zod";
import { addSubmissionToQueue } from "@/modules/app/lib/queue/queue-manager";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";

const ManualProcessSchema = z.object({
  content: z.string().min(10),
  source: z.nativeEnum(SubmissionSource).default(SubmissionSource.API),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = ManualProcessSchema.parse(body);

    // Gate by plan (only Grow/Grow Pro/Premium have AI processing)
    const planInfo = await getOrganizationPlanInfo(orgId);
    const canUseAi = Boolean(planInfo?.features?.hasAiProcessing && planInfo?.hasActivePlan);
    if (!canUseAi) {
      return NextResponse.json({
        success: false,
        message: "AI processing not available for this organization's plan",
        plan: planInfo?.planType || "STARTER",
      }, { status: 403 });
    }

    // Add to processing queue
    const job = await addSubmissionToQueue({
      orgId,
      content: validatedData.content,
      source: validatedData.source,
      metadata: validatedData.metadata,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Reporte agregado a la cola de procesamiento",
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error procesando reporte" },
      { status: 500 }
    );
  }
}
