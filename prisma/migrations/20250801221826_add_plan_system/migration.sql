/*
  Warnings:

  - Added the required column `planType` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STARTER', 'GROW', 'GROW_PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "PaymentGateway" ADD VALUE 'MERCADO_PAGO';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "aiProcessingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentInvestigators" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentPlan" "PlanType" DEFAULT 'STARTER',
ADD COLUMN     "currentUsers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "emailReportsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasActivePlan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAiProcessingActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isChatbotActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailChannelActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneChannelActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionSetupCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "hasAdvancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasAiProcessing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasBilingualSupport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasChatbotChannel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasColorThemes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasCustomization" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasEmailChannel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasExternalManager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPhoneChannel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasUnlimitedCustomization" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasUnlimitedUsers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxEmployees" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "maxInvestigators" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "monthlyPrice" DECIMAL(65,30),
ADD COLUMN     "planType" "PlanType" NOT NULL,
ADD COLUMN     "trialDays" INTEGER DEFAULT 14,
ADD COLUMN     "yearlyPrice" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#0066CC',
    "secondaryColor" TEXT DEFAULT '#4A90E2',
    "accentColor" TEXT DEFAULT '#E3F2FD',
    "backgroundColor" TEXT DEFAULT '#F8FAFC',
    "customCSS" TEXT,
    "dashboardLayout" JSONB,
    "emailTemplates" JSONB,
    "brandingConfig" JSONB,
    "notificationSettings" JSONB,
    "securitySettings" JSONB,
    "featureFlags" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "language" TEXT DEFAULT 'es',
    "timezone" TEXT DEFAULT 'America/Bogota',
    "notificationPreferences" JSONB,
    "dashboardPreferences" JSONB,
    "uiPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key" ON "OrganizationSettings"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationSettings_organizationId_idx" ON "OrganizationSettings"("organizationId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_organizationId_idx" ON "UserSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_organizationId_key" ON "UserSettings"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Organization_currentPlan_idx" ON "Organization"("currentPlan");

-- CreateIndex
CREATE INDEX "Organization_hasActivePlan_idx" ON "Organization"("hasActivePlan");

-- CreateIndex
CREATE INDEX "Subscription_orgId_idx" ON "Subscription"("orgId");

-- CreateIndex
CREATE INDEX "Subscription_planType_idx" ON "Subscription"("planType");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
