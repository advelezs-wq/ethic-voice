-- CreateTable
CREATE TABLE "ReportUpdate" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,

    CONSTRAINT "ReportUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportUpdate_submissionId_idx" ON "ReportUpdate"("submissionId");

-- CreateIndex
CREATE INDEX "ReportUpdate_status_idx" ON "ReportUpdate"("status");

-- CreateIndex
CREATE INDEX "ReportUpdate_createdAt_idx" ON "ReportUpdate"("createdAt");

-- AddForeignKey
ALTER TABLE "ReportUpdate" ADD CONSTRAINT "ReportUpdate_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
