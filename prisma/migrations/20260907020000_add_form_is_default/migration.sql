-- AlterTable: canonical form per org, used to resolve the per-org public
-- link (Organization.slug) to a custom form for Grow+ plans.
ALTER TABLE "Form" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
