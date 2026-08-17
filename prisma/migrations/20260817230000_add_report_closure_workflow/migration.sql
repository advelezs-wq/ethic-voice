-- AlterTable: two-stage case closure — an investigator (or admin) submits
-- a closure request with findings + outcome + evidence attachments; if the
-- requester isn't an org admin the report stays open until an admin
-- approves it. All nullable/additive, no backfill needed.
ALTER TABLE "FormSubmission"
  ADD COLUMN "closureSummary" TEXT,
  ADD COLUMN "closureOutcome" TEXT,
  ADD COLUMN "closureRequestedAt" TIMESTAMP(3),
  ADD COLUMN "closureRequestedById" TEXT,
  ADD COLUMN "closureRequestedByName" TEXT,
  ADD COLUMN "closureApprovedAt" TIMESTAMP(3),
  ADD COLUMN "closureApprovedById" TEXT,
  ADD COLUMN "closureApprovedByName" TEXT,
  ADD COLUMN "closureRejectionReason" TEXT;
