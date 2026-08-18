ALTER TABLE "FormSubmission"
  ADD COLUMN "reporterDataAnonymized" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reporterDataAnonymizedAt" TIMESTAMP(3),
  ADD COLUMN "reporterDataAnonymizedById" TEXT,
  ADD COLUMN "reporterDataAnonymizedByName" TEXT;
