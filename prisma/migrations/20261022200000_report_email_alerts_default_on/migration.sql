-- New-report and urgent-report emails were off by default, so admins were
-- never emailed when a report arrived. Turn them on for new settings rows.
ALTER TABLE "NotificationSettings" ALTER COLUMN "emailReportCreated" SET DEFAULT true;
ALTER TABLE "NotificationSettings" ALTER COLUMN "emailSystemAlerts" SET DEFAULT true;
