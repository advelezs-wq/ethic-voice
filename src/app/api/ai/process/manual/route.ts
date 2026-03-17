import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { SubmissionSource } from "@/types/submission.types";
import { z } from "zod";
import {
  addSubmissionToQueue,
  submissionQueue,
} from "@/modules/app/lib/queue/queue-manager";
import { getOrganizationPlanInfo } from "@/modules/core/utils/subscription.utils";
import { submissionProcessor } from "@/modules/app/services/submission-processor.service";

const ManualProcessSchema = z.object({
  content: z.string().min(10),
  source: z.nativeEnum(SubmissionSource).default(SubmissionSource.API),
  metadata: z.record(z.any()).optional(),
  sync: z.boolean().default(false),
  timeoutMs: z.number().int().min(3000).max(30000).default(12000),
  fallbackToQueue: z.boolean().default(true),
});

class SyncTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncTimeoutError";
  }
}

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
    if (!validatedData.sync) {
      const job = await addSubmissionToQueue({
        orgId,
        content: validatedData.content,
        source: validatedData.source,
        metadata: validatedData.metadata,
      });

      return NextResponse.json({
        success: true,
        mode: "queued",
        jobId: job.id,
        message: "Reporte agregado a la cola de procesamiento",
      });
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new SyncTimeoutError(
              "El analisis excedio el tiempo de respuesta sincrona"
            )
          ),
        validatedData.timeoutMs
      );
    });

    try {
      const result = await Promise.race([
        submissionProcessor.processSubmission({
          orgId,
          content: validatedData.content,
          source: validatedData.source,
          metadata: validatedData.metadata,
        }),
        timeoutPromise,
      ]);

      return NextResponse.json({
        success: true,
        mode: "sync",
        fallbackQueued: false,
        submissionId: result.submissionId,
        trackingCode: result.trackingCode,
        analysis: result.analysis,
        message: "Analisis completado correctamente",
      });
    } catch (syncError) {
      if (!validatedData.fallbackToQueue) {
        throw syncError;
      }

      const submissionId = validatedData.metadata?.submissionId as
        | number
        | undefined;
      const dedupJobId = submissionId ? `submission-${orgId}-${submissionId}` : null;
      let alreadyQueued = false;
      if (dedupJobId) {
        const existingJob = await submissionQueue.getJob(dedupJobId);
        alreadyQueued = !!existingJob;
      }

      const job = alreadyQueued
        ? { id: dedupJobId }
        : await addSubmissionToQueue({
            orgId,
            content: validatedData.content,
            source: validatedData.source,
            metadata: validatedData.metadata,
          });

      return NextResponse.json({
        success: true,
        mode: "fallback_queued",
        fallbackQueued: true,
        jobId: job.id,
        reason:
          syncError instanceof SyncTimeoutError
            ? "timeout"
            : "sync_processing_error",
        message:
          syncError instanceof SyncTimeoutError
            ? "El analisis tardo demasiado; se encolo automaticamente."
            : "No se pudo completar sincrono; se encolo automaticamente.",
      });
    }
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
