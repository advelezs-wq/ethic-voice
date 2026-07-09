-- CreateTable: recursos descargables (lead magnets) administrables desde Super Admin
CREATE TABLE "LeadMagnet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "fileUrl" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "formFields" JSONB,
    "ctaLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadMagnet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadMagnet_slug_key" ON "LeadMagnet"("slug");

-- CreateIndex
CREATE INDEX "LeadMagnet_campaign_idx" ON "LeadMagnet"("campaign");

-- CreateIndex
CREATE INDEX "LeadMagnet_isActive_idx" ON "LeadMagnet"("isActive");
