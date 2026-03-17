// app/lib/background-processor.ts
import prisma from "@/modules/prisma/lib/prisma";
import { submissionProcessor } from "@/modules/app/services/submission-processor.service";
import { SubmissionSource } from "@/types/submission.types";

export class BackgroundProcessor {
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  /**
   * Process failed jobs in the background
   */
  async processFailedJobs() {
    if (this.isProcessing) {
      console.log("[BACKGROUND] Background processor already running");
      return;
    }

    this.isProcessing = true;
    console.log("[BACKGROUND] Starting background job processor");

    try {
      const failedJobs = await prisma.aiProcessingJob.findMany({
        where: {
          status: "failed",
          attempts: {
            lt: this.maxRetries,
          },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 5, // Process 5 at a time
      });

      console.log(`📝 Found ${failedJobs.length} failed jobs to retry`);

      for (const job of failedJobs) {
        try {
          await this.retryJob(job);
          await this.sleep(this.retryDelay);
        } catch (error) {
          console.error(`❌ Failed to retry job ${job.id}:`, error);
        }
      }

      // Clean up old successful jobs
      await this.cleanupOldJobs();
    } catch (error) {
      console.error("❌ Background processor error:", error);
    } finally {
      this.isProcessing = false;
      console.log("[BACKGROUND] Background processor finished");
    }
  }

  /**
   * Retry a specific failed job
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async retryJob(job: any) {
          console.log(`[BACKGROUND] Retrying job ${job.id} (attempt ${job.attempts + 1})`);

    try {
      // Parse the raw content
      let parsedContent;
      try {
        parsedContent = JSON.parse(job.rawContent);
      } catch {
        // If it's not JSON, treat as plain content
        parsedContent = { content: job.rawContent };
      }

      const content = parsedContent.content || job.rawContent;
      const metadata =
        parsedContent.metadata || JSON.parse(job.metadata || "{}");

      // Extract reporter info if available
      const reporterInfo = {
        name: metadata.reporterName || null,
        email: metadata.reporterEmail || null,
        phone: metadata.reporterPhone || null,
        isAnonymous: metadata.isAnonymous || false,
      };

      // Mark job as processing
      await prisma.aiProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "processing",
          attempts: { increment: 1 },
          errorMessage: null,
        },
      });

      // Process the submission
      const result = await submissionProcessor.processSubmission({
        orgId: job.orgId,
        content,
        source: job.source as SubmissionSource,
        metadata,
        reporterInfo,
      });

      console.log(
        `✅ Successfully retried job ${job.id}, created submission ${result.submissionId}`
      );
    } catch (error) {
      console.error(`❌ Retry failed for job ${job.id}:`, error);

      // Update job with new failure
      await prisma.aiProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          errorMessage:
            (error as { message: string })?.message || "Retry failed",
        },
      });

      // If max retries reached, mark as permanently failed
      const updatedJob = await prisma.aiProcessingJob.findUnique({
        where: { id: job.id },
      });

      if (updatedJob && updatedJob.attempts >= this.maxRetries) {
        await prisma.aiProcessingJob.update({
          where: { id: job.id },
          data: {
            status: "permanently_failed",
            errorMessage: `Max retries (${
              this.maxRetries
            }) exceeded. Last error: ${
              (error as { message: string })?.message
            }`,
          },
        });

        console.log(
          `💀 Job ${job.id} permanently failed after ${this.maxRetries} attempts`
        );
      }
    }
  }

  /**
   * Clean up old completed jobs
   */
  private async cleanupOldJobs() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deleted = await prisma.aiProcessingJob.deleteMany({
      where: {
        status: "completed",
        completedAt: {
          lt: oneWeekAgo,
        },
      },
    });

    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} old completed jobs`);
    }
  }

  /**
   * Get processing statistics
   */
  async getStats() {
    const stats = await prisma.aiProcessingJob.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const backgroundProcessor = new BackgroundProcessor();
