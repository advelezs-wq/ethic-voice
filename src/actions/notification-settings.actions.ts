'use client';

export interface NotificationSettings {
  id?: string;
  userId: string;
  orgId?: string;
  emailReportCreated: boolean;
  emailReportAssigned: boolean;
  emailReportStatusChanged: boolean;
  emailReportComment: boolean;
  emailSystemAlerts: boolean;
  inAppReportCreated: boolean;
  inAppReportAssigned: boolean;
  inAppReportStatusChanged: boolean;
  inAppReportComment: boolean;
  inAppSystemAlerts: boolean;
  enableDailyDigest: boolean;
  enableWeeklyDigest: boolean;
  digestTime: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateNotificationSettingsData {
  emailReportCreated?: boolean;
  emailReportAssigned?: boolean;
  emailReportStatusChanged?: boolean;
  emailReportComment?: boolean;
  emailSystemAlerts?: boolean;
  inAppReportCreated?: boolean;
  inAppReportAssigned?: boolean;
  inAppReportStatusChanged?: boolean;
  inAppReportComment?: boolean;
  inAppSystemAlerts?: boolean;
  enableDailyDigest?: boolean;
  enableWeeklyDigest?: boolean;
  digestTime?: string;
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const response = await fetch('/api/notifications/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification settings');
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
}

export async function updateNotificationSettings(
  settingsData: UpdateNotificationSettingsData
): Promise<NotificationSettings> {
  try {
    const response = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update notification settings');
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
} 