-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubmissionSource" ADD VALUE 'EMAIL';
ALTER TYPE "SubmissionSource" ADD VALUE 'WHATSAPP';
ALTER TYPE "SubmissionSource" ADD VALUE 'API';

-- CreateTable
CREATE TABLE "AiProcessingJob" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "processedContent" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "organizationId" TEXT,

    CONSTRAINT "AiProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailConfiguration" (
    "id" SERIAL NOT NULL,
    "orgId" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "subjectKeywords" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTracking" (
    "id" SERIAL NOT NULL,
    "orgId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "UsageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTemplate" (
    "id" SERIAL NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promptTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiProcessingJob_status_idx" ON "AiProcessingJob"("status");

-- CreateIndex
CREATE INDEX "AiProcessingJob_submissionId_idx" ON "AiProcessingJob"("submissionId");

-- CreateIndex
CREATE INDEX "AiProcessingJob_createdAt_idx" ON "AiProcessingJob"("createdAt");

-- CreateIndex
CREATE INDEX "EmailConfiguration_orgId_idx" ON "EmailConfiguration"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfiguration_orgId_emailAddress_key" ON "EmailConfiguration"("orgId", "emailAddress");

-- CreateIndex
CREATE INDEX "UsageTracking_orgId_idx" ON "UsageTracking"("orgId");

-- CreateIndex
CREATE INDEX "UsageTracking_timestamp_idx" ON "UsageTracking"("timestamp");

-- CreateIndex
CREATE INDEX "AiTemplate_orgId_idx" ON "AiTemplate"("orgId");

-- AddForeignKey
ALTER TABLE "AiProcessingJob" ADD CONSTRAINT "AiProcessingJob_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProcessingJob" ADD CONSTRAINT "AiProcessingJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailConfiguration" ADD CONSTRAINT "EmailConfiguration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageTracking" ADD CONSTRAINT "UsageTracking_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTemplate" ADD CONSTRAINT "AiTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
