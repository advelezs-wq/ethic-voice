-- Add new enums for plan system
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'GROW', 'GROW_PRO', 'PREMIUM');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- Add MERCADO_PAGO to PaymentGateway enum
ALTER TYPE "PaymentGateway" ADD VALUE 'MERCADO_PAGO';

-- Add plan and subscription fields to Organization
ALTER TABLE "Organization" ADD COLUMN "currentPlan" "PlanType" DEFAULT 'STARTER';
ALTER TABLE "Organization" ADD COLUMN "hasActivePlan" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "subscriptionSetupCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Add plan usage tracking to Organization
ALTER TABLE "Organization" ADD COLUMN "currentUsers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Organization" ADD COLUMN "currentInvestigators" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "emailReportsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN "aiProcessingCount" INTEGER NOT NULL DEFAULT 0;

-- Add plan restrictions to Organization
ALTER TABLE "Organization" ADD COLUMN "isEmailChannelActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "isAiProcessingActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "isChatbotActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "isPhoneChannelActive" BOOLEAN NOT NULL DEFAULT false;

-- Add new fields to Subscription table
ALTER TABLE "Subscription" ADD COLUMN "planType" "PlanType" NOT NULL DEFAULT 'STARTER';
ALTER TABLE "Subscription" ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';

-- Add plan features and limits to Subscription
ALTER TABLE "Subscription" ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Subscription" ADD COLUMN "maxInvestigators" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "Subscription" ADD COLUMN "maxEmployees" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Subscription" ADD COLUMN "hasEmailChannel" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasAiProcessing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasChatbotChannel" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasPhoneChannel" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasExternalManager" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasBilingualSupport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasUnlimitedUsers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasAdvancedAnalytics" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasCustomization" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasColorThemes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "hasUnlimitedCustomization" BOOLEAN NOT NULL DEFAULT false;

-- Add pricing fields to Subscription
ALTER TABLE "Subscription" ADD COLUMN "monthlyPrice" DECIMAL(65,30);
ALTER TABLE "Subscription" ADD COLUMN "yearlyPrice" DECIMAL(65,30);
ALTER TABLE "Subscription" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- Add trial information to Subscription
ALTER TABLE "Subscription" ADD COLUMN "trialDays" INTEGER DEFAULT 14;
ALTER TABLE "Subscription" ADD COLUMN "isTrialActive" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for better performance
CREATE INDEX "Organization_currentPlan_idx" ON "Organization"("currentPlan");
CREATE INDEX "Organization_hasActivePlan_idx" ON "Organization"("hasActivePlan");
CREATE INDEX "Subscription_orgId_idx" ON "Subscription"("orgId");
CREATE INDEX "Subscription_planType_idx" ON "Subscription"("planType");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status"); 