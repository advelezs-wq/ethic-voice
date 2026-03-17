/*
  Warnings:

  - The values [MERCADO_PAGO] on the enum `PaymentGateway` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentGateway_new" AS ENUM ('WOMPI', 'EPAYCO', 'REBILL', 'OTHER');
ALTER TABLE "PaymentTransaction" ALTER COLUMN "gateway" TYPE "PaymentGateway_new" USING ("gateway"::text::"PaymentGateway_new");
ALTER TYPE "PaymentGateway" RENAME TO "PaymentGateway_old";
ALTER TYPE "PaymentGateway_new" RENAME TO "PaymentGateway";
DROP TYPE "PaymentGateway_old";
COMMIT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "orgId" DROP NOT NULL;
