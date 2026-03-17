/*
  Warnings:

  - You are about to drop the column `organizationId` on the `AiProcessingJob` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgId]` on the table `EmailConfiguration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[emailAlias]` on the table `EmailConfiguration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgId` to the `AiProcessingJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateType` to the `AiTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailAlias` to the `EmailConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feature` to the `UsageTracking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AiProcessingJob" DROP CONSTRAINT "AiProcessingJob_organizationId_fkey";

-- DropIndex
DROP INDEX "EmailConfiguration_orgId_emailAddress_key";

-- DropIndex
DROP INDEX "EmailConfiguration_orgId_idx";

-- AlterTable
ALTER TABLE "AiProcessingJob" DROP COLUMN "organizationId",
ADD COLUMN     "orgId" TEXT NOT NULL,
ADD COLUMN     "processingSteps" JSONB;

-- AlterTable
ALTER TABLE "AiTemplate" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateType" TEXT NOT NULL,
ADD COLUMN     "variables" TEXT[];

-- AlterTable
ALTER TABLE "EmailConfiguration" ADD COLUMN     "autoProcess" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailAlias" TEXT NOT NULL,
ADD COLUMN     "emailsProcessed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "parseRules" JSONB;

-- AlterTable
ALTER TABLE "UsageTracking" ADD COLUMN     "feature" TEXT NOT NULL,
ADD COLUMN     "submissionId" INTEGER;

-- CreateTable
CREATE TABLE "ProcessingRule" (
    "id" SERIAL NOT NULL,
    "orgId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProcessingRule_orgId_idx" ON "ProcessingRule"("orgId");

-- CreateIndex
CREATE INDEX "ProcessingRule_priority_idx" ON "ProcessingRule"("priority");

-- CreateIndex
CREATE INDEX "AiProcessingJob_orgId_idx" ON "AiProcessingJob"("orgId");

-- CreateIndex
CREATE INDEX "AiTemplate_templateType_idx" ON "AiTemplate"("templateType");

-- CreateIndex
CREATE INDEX "EmailConfiguration_emailAlias_idx" ON "EmailConfiguration"("emailAlias");

-- CreateIndex
CREATE INDEX "EmailConfiguration_isActive_idx" ON "EmailConfiguration"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfiguration_orgId_key" ON "EmailConfiguration"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailConfiguration_emailAlias_key" ON "EmailConfiguration"("emailAlias");

-- CreateIndex
CREATE INDEX "UsageTracking_feature_idx" ON "UsageTracking"("feature");

-- AddForeignKey
ALTER TABLE "AiProcessingJob" ADD CONSTRAINT "AiProcessingJob_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingRule" ADD CONSTRAINT "ProcessingRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
