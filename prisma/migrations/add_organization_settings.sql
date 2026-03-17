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

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key" ON "OrganizationSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_organizationId_key" ON "UserSettings"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE; 