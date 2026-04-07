-- AlterTable
ALTER TABLE "ReportUpdate" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completionNotes" TEXT,
ALTER COLUMN "description" SET DEFAULT '';
