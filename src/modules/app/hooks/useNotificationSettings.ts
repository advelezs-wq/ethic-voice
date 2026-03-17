'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  NotificationSettings,
  UpdateNotificationSettingsData,
  getNotificationSettings,
  updateNotificationSettings 
} from '@/actions/notification-settings.actions';

export function useNotificationSettings() {
  const { user } = useUser();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const fetchedSettings = await getNotificationSettings();
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (settingsData: UpdateNotificationSettingsData) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedSettings = await updateNotificationSettings(settingsData);
      setSettings(updatedSettings);
      // You can add a toast notification here if you have a toast system
      console.log('Configuración actualizada exitosamente');
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar configuración');
      throw err; // Re-throw to let the component handle it
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
} 