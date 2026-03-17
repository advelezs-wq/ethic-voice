-- AlterTable
ALTER TABLE "ReportUpdate" ADD COLUMN "parentId" INTEGER;
ALTER TABLE "ReportUpdate" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add self-referencing foreign key for subtasks hierarchy
ALTER TABLE "ReportUpdate"
  ADD CONSTRAINT "ReportUpdate_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ReportUpdate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Composite index to support ordered siblings lookups
CREATE INDEX "ReportUpdate_submissionId_parentId_order_idx"
  ON "ReportUpdate"("submissionId", "parentId", "order"); 