'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Button, Switch, Input, Divider, Spinner } from '@heroui/react';
import { useNotificationSettings } from '@/modules/app/hooks/useNotificationSettings';
import { UpdateNotificationSettingsData } from '@/actions/notification-settings.actions';
import { useUserRole } from '@/modules/core/hooks/useUserRole';
import { UserRole } from '@/types/auth.types';

export function NotificationPreferences() {
  const { settings, isLoading, isUpdating, error, updateSettings } = useNotificationSettings();
  const { role, isLoading: roleLoading } = useUserRole();
  const [localSettings, setLocalSettings] = useState<UpdateNotificationSettingsData>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Define what notification types are relevant for each role
  const getRelevantNotifications = (userRole: UserRole) => {
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return {
          reportCreated: true,
          reportAssigned: true,
          reportStatusChanged: true,
          reportComment: true,
          systemAlerts: true,
        };
      case UserRole.ORG_ADMIN:
        return {
          reportCreated: true,
          reportAssigned: true,
          reportStatusChanged: true,
          reportComment: true,
          systemAlerts: true,
        };
      case UserRole.ORG_MEMBER:
        return {
          reportCreated: false, // Members don't need to know about all new reports
          reportAssigned: true,
          reportStatusChanged: true,
          reportComment: true,
          systemAlerts: false,  // Members don't need system alerts
        };
      default:
        return {
          reportCreated: false,
          reportAssigned: true,
          reportStatusChanged: true,
          reportComment: true,
          systemAlerts: false,
        };
    }
  };

  // Get gentle defaults for better UX
  const getGentleDefaults = (userRole: UserRole) => {
    const relevantNotifications = getRelevantNotifications(userRole);
    
    return {
      // Email notifications - more conservative by default
      emailReportCreated: relevantNotifications.reportCreated && false, // Off by default for better UX
      emailReportAssigned: true, // Important - keep on
      emailReportStatusChanged: false, // Off by default - can be overwhelming
      emailReportComment: false, // Off by default - can be overwhelming  
      emailSystemAlerts: relevantNotifications.systemAlerts && false, // Off by default unless critical

      // In-app notifications - more permissive 
      inAppReportCreated: relevantNotifications.reportCreated,
      inAppReportAssigned: true,
      inAppReportStatusChanged: true,
      inAppReportComment: true,
      inAppSystemAlerts: relevantNotifications.systemAlerts,

      // Digest settings - weekly by default for less noise
      enableDailyDigest: false,
      enableWeeklyDigest: userRole !== UserRole.ORG_MEMBER, // Only for admins by default
      digestTime: '09:00',
    };
  };

  const relevantNotifications = role ? getRelevantNotifications(role) : null;

  // Update local settings when server settings are loaded
  React.useEffect(() => {
    if (settings && role) {
      setLocalSettings({
        emailReportCreated: settings.emailReportCreated,
        emailReportAssigned: settings.emailReportAssigned,
        emailReportStatusChanged: settings.emailReportStatusChanged,
        emailReportComment: settings.emailReportComment,
        emailSystemAlerts: settings.emailSystemAlerts,
        inAppReportCreated: settings.inAppReportCreated,
        inAppReportAssigned: settings.inAppReportAssigned,
        inAppReportStatusChanged: settings.inAppReportStatusChanged,
        inAppReportComment: settings.inAppReportComment,
        inAppSystemAlerts: settings.inAppSystemAlerts,
        enableDailyDigest: settings.enableDailyDigest,
        enableWeeklyDigest: settings.enableWeeklyDigest,
        digestTime: settings.digestTime,
      });
    } else if (!settings && role) {
      // If no settings exist, use gentle defaults
      const defaults = getGentleDefaults(role);
      setLocalSettings(defaults);
    }
  }, [settings, role]);

  const handleSettingChange = (key: keyof UpdateNotificationSettingsData, value: boolean | string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        emailReportCreated: settings.emailReportCreated,
        emailReportAssigned: settings.emailReportAssigned,
        emailReportStatusChanged: settings.emailReportStatusChanged,
        emailReportComment: settings.emailReportComment,
        emailSystemAlerts: settings.emailSystemAlerts,
        inAppReportCreated: settings.inAppReportCreated,
        inAppReportAssigned: settings.inAppReportAssigned,
        inAppReportStatusChanged: settings.inAppReportStatusChanged,
        inAppReportComment: settings.inAppReportComment,
        inAppSystemAlerts: settings.inAppSystemAlerts,
        enableDailyDigest: settings.enableDailyDigest,
        enableWeeklyDigest: settings.enableWeeklyDigest,
        digestTime: settings.digestTime,
      });
      setHasChanges(false);
    }
  };

  if (isLoading || roleLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--bell] size-5" />
            <h3 className="text-lg font-semibold">Preferencias de Notificaciones</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
            <span className="ml-2">Cargando configuración...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--bell] size-5" />
            <h3 className="text-lg font-semibold">Preferencias de Notificaciones</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-danger py-4">
            Error al cargar configuración: {error}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--bell] size-5" />
            <h3 className="text-lg font-semibold">Preferencias de Notificaciones</h3>
          </div>
          <p className="text-sm text-gray-600">
            Configura cómo y cuándo quieres recibir notificaciones sobre la actividad en la plataforma.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--mail] size-4" />
            <h4 className="text-base font-medium">Notificaciones por Email</h4>
          </div>
          
          <div className="space-y-3 pl-6">
            {relevantNotifications?.reportCreated && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Nuevo reporte creado</span>
                <Switch
                  isSelected={localSettings.emailReportCreated ?? false}
                  onValueChange={(checked) => handleSettingChange('emailReportCreated', checked)}
                  size="sm"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Reporte asignado a mí</span>
              <Switch
                isSelected={localSettings.emailReportAssigned ?? false}
                onValueChange={(checked) => handleSettingChange('emailReportAssigned', checked)}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Cambios de estado en reportes</span>
              <Switch
                isSelected={localSettings.emailReportStatusChanged ?? false}
                onValueChange={(checked) => handleSettingChange('emailReportStatusChanged', checked)}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Nuevos comentarios en reportes</span>
              <Switch
                isSelected={localSettings.emailReportComment ?? false}
                onValueChange={(checked) => handleSettingChange('emailReportComment', checked)}
                size="sm"
              />
            </div>
            
            {relevantNotifications?.systemAlerts && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas del sistema</span>
                <Switch
                  isSelected={localSettings.emailSystemAlerts ?? false}
                  onValueChange={(checked) => handleSettingChange('emailSystemAlerts', checked)}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* In-App Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--smartphone] size-4" />
            <h4 className="text-base font-medium">Notificaciones en la Aplicación</h4>
          </div>
          
          <div className="space-y-3 pl-6">
            {relevantNotifications?.reportCreated && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Nuevo reporte creado</span>
                <Switch
                  isSelected={localSettings.inAppReportCreated ?? false}
                  onValueChange={(checked) => handleSettingChange('inAppReportCreated', checked)}
                  size="sm"
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Reporte asignado a mí</span>
              <Switch
                isSelected={localSettings.inAppReportAssigned ?? false}
                onValueChange={(checked) => handleSettingChange('inAppReportAssigned', checked)}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Cambios de estado en reportes</span>
              <Switch
                isSelected={localSettings.inAppReportStatusChanged ?? false}
                onValueChange={(checked) => handleSettingChange('inAppReportStatusChanged', checked)}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Nuevos comentarios en reportes</span>
              <Switch
                isSelected={localSettings.inAppReportComment ?? false}
                onValueChange={(checked) => handleSettingChange('inAppReportComment', checked)}
                size="sm"
              />
            </div>
            
            {relevantNotifications?.systemAlerts && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Alertas del sistema</span>
                <Switch
                  isSelected={localSettings.inAppSystemAlerts ?? false}
                  onValueChange={(checked) => handleSettingChange('inAppSystemAlerts', checked)}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Digest Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <i className="icon-[lucide--clock] size-4" />
            <h4 className="text-base font-medium">Resúmenes por Email</h4>
          </div>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <span className="text-sm">Resumen diario</span>
              <Switch
                isSelected={localSettings.enableDailyDigest ?? false}
                onValueChange={(checked) => handleSettingChange('enableDailyDigest', checked)}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Resumen semanal</span>
              <Switch
                isSelected={localSettings.enableWeeklyDigest ?? false}
                onValueChange={(checked) => handleSettingChange('enableWeeklyDigest', checked)}
                size="sm"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Hora de envío de resúmenes</span>
              <Input
                type="time"
                value={localSettings.digestTime || '09:00'}
                onChange={(e) => handleSettingChange('digestTime', e.target.value)}
                className="w-32"
                size="sm"
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="bordered"
            onPress={handleReset}
            isDisabled={!hasChanges || isUpdating}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!hasChanges || isUpdating}
            isLoading={isUpdating}
            size="sm"
          >
            {isUpdating ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
} 