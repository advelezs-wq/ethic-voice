-- AlterTable: opaque public tracking token, decoupled from the sequential
-- FormSubmission.id (a global autoincrement shared across every org on the
-- platform, so "REP-000123" was trivially enumerable) — this is what
-- /track/[code] and the reporter-facing chat now resolve reports by.
ALTER TABLE "FormSubmission" ADD COLUMN "trackingToken" TEXT;

-- Backfill existing rows before enforcing NOT NULL / UNIQUE.
UPDATE "FormSubmission"
SET "trackingToken" = upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12))
WHERE "trackingToken" IS NULL;

ALTER TABLE "FormSubmission"
  ALTER COLUMN "trackingToken" SET DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12)),
  ALTER COLUMN "trackingToken" SET NOT NULL;

CREATE UNIQUE INDEX "FormSubmission_trackingToken_key" ON "FormSubmission"("trackingToken");
