-- AlterTable: per-case confidentiality restriction — restricts visibility
-- to assigned investigators + admins/viewers, hiding it from the rest of
-- the org (default false = today's behavior, unchanged).
ALTER TABLE "FormSubmission"
  ADD COLUMN "isConfidential" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "confidentialSetById" TEXT,
  ADD COLUMN "confidentialSetByName" TEXT;

CREATE INDEX "FormSubmission_isConfidential_idx" ON "FormSubmission"("isConfidential");
