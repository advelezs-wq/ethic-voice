/*
  Warnings:

  - You are about to drop the column `assignedAt` on the `FormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `assigneeId` on the `FormSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `assigneeName` on the `FormSubmission` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "FormSubmission_assigneeId_idx";

-- AlterTable
ALTER TABLE "FormSubmission" DROP COLUMN "assignedAt",
DROP COLUMN "assigneeId",
DROP COLUMN "assigneeName";

-- CreateTable
CREATE TABLE "ReportAssignment" (
    "id" TEXT NOT NULL,
    "reportId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ReportAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportAssignment_reportId_idx" ON "ReportAssignment"("reportId");

-- CreateIndex
CREATE INDEX "ReportAssignment_userId_idx" ON "ReportAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportAssignment_reportId_userId_key" ON "ReportAssignment"("reportId", "userId");

-- AddForeignKey
ALTER TABLE "ReportAssignment" ADD CONSTRAINT "ReportAssignment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
