-- AlterTable
ALTER TABLE "NotificationSettings" ALTER COLUMN "emailReportCreated" SET DEFAULT false,
ALTER COLUMN "emailReportStatusChanged" SET DEFAULT false,
ALTER COLUMN "emailSystemAlerts" SET DEFAULT false,
ALTER COLUMN "enableWeeklyDigest" SET DEFAULT false;
