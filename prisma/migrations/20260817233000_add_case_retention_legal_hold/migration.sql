-- AlterTable: org-level retention policy (nullable = keep indefinitely,
-- the safe default; auto-delete defaults off, expired cases queue for
-- admin review unless the org explicitly opts into automation).
ALTER TABLE "Organization"
  ADD COLUMN "caseRetentionDays" INTEGER,
  ADD COLUMN "autoDeleteOnRetentionExpiry" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: per-case retention timestamp + legal hold, which
-- unconditionally overrides retention expiry.
ALTER TABLE "FormSubmission"
  ADD COLUMN "retentionExpiresAt" TIMESTAMP(3),
  ADD COLUMN "legalHold" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "legalHoldReason" TEXT,
  ADD COLUMN "legalHoldSetAt" TIMESTAMP(3),
  ADD COLUMN "legalHoldSetById" TEXT,
  ADD COLUMN "legalHoldSetByName" TEXT;

CREATE INDEX "FormSubmission_retentionExpiresAt_idx" ON "FormSubmission"("retentionExpiresAt");
