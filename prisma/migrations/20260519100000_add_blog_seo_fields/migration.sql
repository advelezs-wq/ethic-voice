-- AlterTable
ALTER TABLE "BlogPost"
ADD COLUMN "metaTitle" TEXT,
ADD COLUMN "metaDescription" TEXT,
ADD COLUMN "canonicalUrl" TEXT,
ADD COLUMN "ogImageUrl" TEXT,
ADD COLUMN "noIndex" BOOLEAN NOT NULL DEFAULT false;
