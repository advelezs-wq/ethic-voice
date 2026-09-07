-- CreateEnum
CREATE TYPE "EthicalDocumentType" AS ENUM ('CODIGO_ETICA', 'REGLAMENTO_INTERNO', 'ANTICORRUPCION', 'COMPRAS', 'GASTOS_VIAJE', 'REGALOS', 'CONFLICTO_INTERES', 'OTRO');

-- CreateTable
CREATE TABLE "OrganizationEthicalContext" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessContext" TEXT,
    "governanceStructure" JSONB,
    "specialCriteria" JSONB,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationEthicalContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EthicalContextDocument" (
    "id" SERIAL NOT NULL,
    "organizationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" "EthicalDocumentType" NOT NULL DEFAULT 'OTRO',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "extractedText" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EthicalContextDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationEthicalContext_organizationId_key" ON "OrganizationEthicalContext"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationEthicalContext_organizationId_idx" ON "OrganizationEthicalContext"("organizationId");

-- CreateIndex
CREATE INDEX "EthicalContextDocument_organizationId_idx" ON "EthicalContextDocument"("organizationId");

-- CreateIndex
CREATE INDEX "EthicalContextDocument_organizationId_isActive_idx" ON "EthicalContextDocument"("organizationId", "isActive");

-- AddForeignKey
ALTER TABLE "OrganizationEthicalContext" ADD CONSTRAINT "OrganizationEthicalContext_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EthicalContextDocument" ADD CONSTRAINT "EthicalContextDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
