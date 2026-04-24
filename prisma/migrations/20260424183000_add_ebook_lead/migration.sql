-- CreateTable
CREATE TABLE "EbookLead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "campaign" TEXT NOT NULL DEFAULT 'guia_canal_denuncias',
    "sourcePath" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EbookLead_email_idx" ON "EbookLead"("email");

-- CreateIndex
CREATE INDEX "EbookLead_campaign_createdAt_idx" ON "EbookLead"("campaign", "createdAt");
