/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue, Worker, Job } from "bullmq";
import { queueRedisConnection } from "./redis-config";
import { SubmissionSource } from "@/types/submission.types";

// Queues enabled by default (no env var dependency)
export const QUEUE_ENABLED = true;

// Definir tipos de jobs
export interface EmailCheckJob {
  type: "check_all" | "check_org";
  orgId?: string;
}

export interface DirectSubmissionJob {
  orgId: string;
  content: string;
  source: SubmissionSource;
  metadata?: any;
  reporterInfo?: any;
  attachments?: Array<{
    filename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    cloudinaryPublicId?: string;
  }>;
}

// Crear colas usando la conexión Redis configurada (solo si está habilitado)
export const emailQueue = QUEUE_ENABLED
  ? new Queue<EmailCheckJob>("email-processing", {
      connection: queueRedisConnection.duplicate(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    })
  : (null as unknown as Queue<EmailCheckJob>);

export const submissionQueue = QUEUE_ENABLED
  ? new Queue<DirectSubmissionJob>("submission-processing", {
      connection: queueRedisConnection.duplicate(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      },
    })
  : (null as unknown as Queue<DirectSubmissionJob>);

// Workers
export function createEmailWorker() {
  if (!QUEUE_ENABLED) return null as unknown as Worker<EmailCheckJob>;
  const worker = new Worker<EmailCheckJob>(
    "email-processing",
    async (job: Job<EmailCheckJob>) => {
      console.log(`[QUEUE] Processing email job: ${job.name}`);

      try {
        console.log(
          "⚠️  Email processing skipped - Google credentials not configured"
        );

        // TODO: Implement email processing when Google credentials are configured
        return {
          processed: false,
          reason: "Google credentials not configured",
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Email processing error:", error);
        throw error;
      }
    },
    {
      connection: queueRedisConnection.duplicate(),
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ [QUEUE] Email job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export function createSubmissionWorker() {
  if (!QUEUE_ENABLED) return null as unknown as Worker<DirectSubmissionJob>;
  const worker = new Worker<DirectSubmissionJob>(
    "submission-processing",
    async (job: Job<DirectSubmissionJob>) => {
      console.log(`[QUEUE] Processing submission job: ${job.name} for org: ${job.data.orgId}`);

      try {
        // Skip jobs without a valid orgId
        if (!job.data.orgId || typeof job.data.orgId !== "string") {
          console.warn("⚠️ [QUEUE] Skipping job without valid orgId:", job.id);
          return { processed: false, reason: "missing_orgId" } as any;
        }

        // Verify org exists before touching DB relations to avoid FK violations
        const orgExists = await (await import("@/modules/prisma/lib/prisma")).default.organization.findUnique({
          where: { id: job.data.orgId },
          select: { id: true },
        });

        if (!orgExists) {
          console.warn(
            `⚠️ [QUEUE] Skipping job ${job.id} - organization not found: ${job.data.orgId}`
          );
          return { processed: false, reason: "org_not_found", orgId: job.data.orgId } as any;
        }

        // Import the processor dynamically to avoid circular dependencies
        const { submissionProcessor } = await import(
          "@/modules/app/services/submission-processor.service"
        );

        const result = await submissionProcessor.processSubmission(job.data);

        console.log(`✅ [QUEUE] Submission processed: ${result.trackingCode}`);
        return result;
      } catch (error) {
        console.error(`❌ [QUEUE] Submission processing error for job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: queueRedisConnection.duplicate(),
      concurrency: 3, // Process up to 3 submissions simultaneously
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ [QUEUE] Submission job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [QUEUE] Submission job ${job?.id} failed:`, err);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`⚠️ [QUEUE] Submission job ${jobId} stalled`);
  });

  return worker;
}

// Enhanced submission queue function with better error handling and deduplication
export async function addSubmissionToQueue(data: DirectSubmissionJob) {
  try {
    if (!data.orgId || typeof data.orgId !== "string") {
      throw new Error("Invalid orgId for submission queue");
    }
    if (!data.content || typeof data.content !== "string") {
      throw new Error("Invalid content for submission queue");
    }
    if (!data.source) {
      throw new Error("Invalid source for submission queue");
    }

    // Generate job ID for deduplication
    let jobId: string;
    
    if (data.metadata?.submissionId) {
      // Use submissionId for deduplication - ensures only one AI processing per submission
      jobId = `submission-${data.orgId}-${data.metadata.submissionId}`;
    } else if (data.metadata?.emailId) {
      // Use emailId for email-based submissions
      jobId = `email-${data.orgId}-${data.metadata.emailId}`;
    } else {
      // Fallback to timestamp-based ID
      jobId = `submission-${data.orgId}-${Date.now()}`;
    }

    // If queues are globally disabled, enqueue using a transient Queue instance
    if (!QUEUE_ENABLED) {
      const { Queue } = await import("bullmq");
      const tempQueue = new Queue<DirectSubmissionJob>("submission-processing", {
        connection: queueRedisConnection.duplicate(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: { count: 50 },
          removeOnFail: { count: 100 },
        },
      });
      const job = await tempQueue.add("process-submission", data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        jobId: jobId,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      });
      await tempQueue.close();
      console.log(`✅ [QUEUE] (transient) Added submission job ${job.id} to queue for org: ${data.orgId}${data.metadata?.submissionId ? ` (submission: ${data.metadata.submissionId})` : ''}`);
      return job as any;
    }

    const job = await submissionQueue.add("process-submission", data, {
      // Add job-specific options
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      // Use deterministic job ID for deduplication
      jobId: jobId,
      // Remove duplicate jobs if they exist
      removeOnComplete: {
        count: 50,
      },
      removeOnFail: {
        count: 100,
      },
    });

    console.log(`✅ [QUEUE] Added submission job ${job.id} to queue for org: ${data.orgId}${data.metadata?.submissionId ? ` (submission: ${data.metadata.submissionId})` : ''}`);
    return job;
  } catch (error) {
    // Check if it's a duplicate job error
    if (error instanceof Error && error.message.includes('Job with id')) {
      console.log(`ℹ️ [QUEUE] Job already exists in queue, skipping duplicate for org: ${data.orgId}${data.metadata?.submissionId ? ` (submission: ${data.metadata.submissionId})` : ''}`);
      // Return a mock job object to maintain API compatibility
      return { id: 'duplicate', name: 'process-submission' } as any;
    }
    
    console.error(`❌ [QUEUE] Failed to add submission to queue:`, error);
    throw error;
  }
}

// Enhanced email scheduling (for future use when Gmail is configured)
export async function scheduleEmailChecks() {
  try {
    if (!QUEUE_ENABLED) {
      console.log("[INFO] Queue disabled; email checks not scheduled");
      return;
    }
    console.log("[INFO] Email checks not scheduled - Gmail not configured");
    return;

    // TODO: Uncomment when Gmail is configured
    /*
    await emailQueue.add(
      'check-all-emails',
      { type: 'check_all' },
      {
        repeat: {
          pattern: "* /10 * * * *", // Every 10 minutes
        },
        jobId: 'email-check-scheduled',
      }
    );
    console.log("✅ [QUEUE] Email checks scheduled");
    */
  } catch (error) {
    console.error("❌ [QUEUE] Error scheduling email checks:", error);
  }
}

// Get comprehensive queue statistics
export async function getQueueStats() {
  try {
    if (!QUEUE_ENABLED) {
      return {
        email: { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 },
        submission: { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 },
        timestamp: new Date().toISOString(),
      };
    }
    const [
      emailWaiting,
      emailActive,
      emailCompleted,
      emailFailed,
      submissionWaiting,
      submissionActive,
      submissionCompleted,
      submissionFailed,
    ] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      submissionQueue.getWaitingCount(),
      submissionQueue.getActiveCount(),
      submissionQueue.getCompletedCount(),
      submissionQueue.getFailedCount(),
    ]);

    return {
      email: {
        waiting: emailWaiting,
        active: emailActive,
        completed: emailCompleted,
        failed: emailFailed,
        total: emailWaiting + emailActive,
      },
      submission: {
        waiting: submissionWaiting,
        active: submissionActive,
        completed: submissionCompleted,
        failed: submissionFailed,
        total: submissionWaiting + submissionActive,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ [QUEUE] Error getting queue stats:", error);
    return {
      email: { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 },
      submission: { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 },
      timestamp: new Date().toISOString(),
    };
  }
}

// Graceful cleanup
export async function cleanupQueues() {
  try {
    if (QUEUE_ENABLED) {
      await emailQueue.close();
      await submissionQueue.close();
      await queueRedisConnection.quit();
    }
    console.log("✅ [QUEUE] Queues cleaned up successfully");
  } catch (error) {
    console.error("❌ [QUEUE] Error cleaning up queues:", error);
  }
}

// Health check for queues
export async function checkQueueHealth() {
  try {
    if (!QUEUE_ENABLED) {
      return { healthy: true, details: { redis: false, emailQueue: true, submissionQueue: true }, stats: await getQueueStats() };
    }
    const stats = await getQueueStats();
    const isHealthy = { redis: queueRedisConnection.status === 'ready', emailQueue: stats.email.failed < 10, submissionQueue: stats.submission.failed < 10 };

    return {
      healthy: Object.values(isHealthy).every(Boolean),
      details: isHealthy,
      stats,
    };
  } catch (error) {
    console.error("❌ [QUEUE] Error checking queue health:", error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

