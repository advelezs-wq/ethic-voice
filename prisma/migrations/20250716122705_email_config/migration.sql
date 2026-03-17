-- AlterTable
ALTER TABLE "EmailConfiguration" ADD COLUMN     "emailProvider" TEXT,
ADD COLUMN     "forwardingAddress" TEXT,
ADD COLUMN     "providerConfig" JSONB;
