/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from 'resend';
import prisma from "@/modules/prisma/lib/prisma";
import { NotificationType, NotificationChannel, NotificationStatus } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NotificationData {
  userId: string;
  orgId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  reportId?: number;
  metadata?: any;
  channel?: NotificationChannel;
}

export interface EmailTemplateData {
  trackingCode?: string;
  orgName?: string;
  reportId?: string;
  reportTitle?: string;
  assigneeName?: string;
  requesterName?: string;
  reportUrl?: string;
  dashboardUrl?: string;
}

export class NotificationsService {
  private fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@ethicvoice.co";

  /**
   * Create notification (in-app, email, or both)
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      const { userId, orgId, type, title, message, actionUrl, reportId, metadata, channel = NotificationChannel.IN_APP } = data;

      // Get user settings
      const userSettings = await this.getUserNotificationSettings(userId, orgId);
      
      // Determine if we should send based on user preferences
      const shouldSendEmail = this.shouldSendEmailNotification(type, userSettings, channel);
      const shouldSendInApp = this.shouldSendInAppNotification(type, userSettings, channel);

      // Create base notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          orgId,
          type,
          channel,
          title,
          message,
          actionUrl,
          reportId,
          metadata,
          status: NotificationStatus.PENDING,
        },
      });

      // Send in-app notification (always create if enabled)
      if (shouldSendInApp) {
        await this.markNotificationAsSent(notification.id);
      }

      // Send email notification if enabled
      if (shouldSendEmail) {
        await this.sendEmailNotification(notification.id, data);
      }

    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification using Resend
   */
  private async sendEmailNotification(notificationId: string, data: NotificationData): Promise<void> {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!user?.email) {
        console.warn(`No email found for user ${data.userId}`);
        return;
      }

      // Get email template and subject based on notification type
      const { subject, html } = await this.getEmailTemplate(data, user);

      // Send email using Resend
      const result = await resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject,
        html,
      });

      // Update notification status
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          emailSent: true,
          sentAt: new Date(),
          status: NotificationStatus.SENT,
        },
      });

      console.log(`Email sent successfully:`, result.data?.id);

    } catch (error) {
      console.error('Error sending email notification:', error);
      
      // Update notification with error
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          emailError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Get email template based on notification type
   */
  private async getEmailTemplate(data: NotificationData, user: any): Promise<{ subject: string; html: string }> {
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    
    // Get organization info if available
    let orgName = 'EthicVoice';
    if (data.orgId) {
      const org = await prisma.organization.findUnique({
        where: { id: data.orgId },
        select: { name: true, brandColor: true },
      });
      orgName = org?.name || orgName;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const trackingCode = data.metadata?.trackingCode;
    const reportId = data.reportId;

    switch (data.type) {
      case NotificationType.SYSTEM_ALERT: {
        // Allow customizing system alerts via metadata.kind
        const kind = data.metadata?.kind as string | undefined;
        if (kind === "subscription_cancelled") {
          return {
            subject: `Tu suscripción fue cancelada - ${orgName}`,
            html: this.getGenericTemplate({
              title: "Tu suscripción fue cancelada",
              message:
                "Tu acceso se mantendrá hasta el final del ciclo de facturación actual. Si no reactivas tu suscripción en los próximos 3 meses, eliminaremos de forma permanente tus datos y los de tu organización. Puedes reactivar cuando quieras desde el panel.",
              orgName,
              actionUrl: `${baseUrl}/app/billing`,
            }),
          };
        }
        if (kind === "data_deletion_warning") {
          return {
            subject: `Aviso de eliminación de datos - ${orgName}`,
            html: this.getGenericTemplate({
              title: "Aviso de eliminación programada",
              message:
                "Tu cuenta y los datos de tu organización han permanecido inactivos por un periodo prolongado. Si no reactivas tu suscripción, eliminaremos toda la información definitivamente en los próximos días.",
              orgName,
              actionUrl: `${baseUrl}/pricing`,
            }),
          };
        }
        // Fallback to generic system alert
        return {
          subject: `${data.title} - ${orgName}`,
          html: this.getGenericTemplate({
            title: data.title,
            message: data.message,
            orgName,
            actionUrl: data.actionUrl ? `${baseUrl}${data.actionUrl}` : undefined,
          }),
        };
      }
      case NotificationType.EMAIL_CONFIRMATION_SENT:
        return {
          subject: `Reporte Recibido - ${trackingCode}`,
          html: this.getConfirmationEmailTemplate({
            trackingCode,
            orgName,
            reportUrl: trackingCode ? `${baseUrl}/track/${trackingCode}` : undefined,
          }),
        };

      case NotificationType.REPORT_CREATED:
        return {
          subject: `Nuevo Reporte Creado - ${orgName}`,
          html: this.getReportCreatedTemplate({
            orgName,
            reportId: reportId?.toString(),
            reportTitle: data.metadata?.reportTitle || `REP-${String(reportId).padStart(6, '0')}`,
            reportUrl: reportId ? `${baseUrl}/app/reports/${reportId}` : undefined,
            dashboardUrl: `${baseUrl}/app/reports`,
          }),
        };

      case NotificationType.REPORT_ASSIGNED:
        return {
          subject: `Reporte Asignado - ${orgName}`,
          html: this.getReportAssignedTemplate({
            orgName,
            assigneeName: userName,
            reportId: reportId?.toString(),
            reportTitle: data.metadata?.reportTitle || `REP-${String(reportId).padStart(6, '0')}`,
            reportUrl: reportId ? `${baseUrl}/app/reports/${reportId}` : undefined,
            requesterName: data.metadata?.requesterName,
          }),
        };

      case NotificationType.REPORT_URGENT:
        return {
          subject: `🚨 URGENTE: Reporte Crítico - ${orgName}`,
          html: this.getUrgentReportTemplate({
            orgName,
            reportId: reportId?.toString(),
            reportTitle: data.metadata?.reportTitle || `REP-${String(reportId).padStart(6, '0')}`,
            reportUrl: reportId ? `${baseUrl}/app/reports/${reportId}` : undefined,
            dashboardUrl: `${baseUrl}/app/reports`,
          }),
        };

      default:
        return {
          subject: `${data.title} - ${orgName}`,
          html: this.getGenericTemplate({
            title: data.title,
            message: data.message,
            orgName,
            actionUrl: data.actionUrl ? `${baseUrl}${data.actionUrl}` : undefined,
          }),
        };
    }
  }

  /**
   * Email template for report confirmation
   */
  private getConfirmationEmailTemplate(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Recibido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align:center; margin-bottom:16px;">
    <img src="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''}/brand/logo-nobg.png" alt="EthicVoice" width="120" />
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="color: #2d3748; margin-bottom: 20px;">✅ Reporte Recibido</h1>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #48bb78;">
      <p><strong>Estimado/a,</strong></p>
      
      <p>Hemos recibido su reporte para <strong>${data.orgName}</strong> exitosamente.</p>
      
      <div style="background: #edf2f7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Código de Seguimiento:</strong></p>
        <p style="font-size: 24px; font-weight: bold; color: #2d3748; margin: 5px 0; letter-spacing: 2px;">${data.trackingCode}</p>
      </div>
      
      <p>Puede consultar el estado de su reporte en cualquier momento usando este código en nuestra plataforma.</p>
      
      ${data.reportUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reportUrl}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          🔍 Consultar Estado del Reporte
        </a>
      </div>
      ` : ''}
      
      <p><strong>¿Qué sigue ahora?</strong></p>
      <ul>
        <li>Su reporte será revisado por nuestro equipo especializado</li>
        <li>Le mantendremos informado sobre el progreso</li>
        <li>Puede agregar información adicional usando su código de seguimiento</li>
      </ul>
      
      <p>Gracias por su colaboración en mantener un ambiente ético y transparente.</p>
      
      <p style="margin-top: 30px;">
        <strong>Atentamente,</strong><br>
        <strong>Sistema de Denuncias ${data.orgName}</strong>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    <p>Este es un mensaje automático, por favor no responda a este correo.</p>
    <p>Si tiene alguna pregunta, utilice su código de seguimiento en nuestra plataforma.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Email template for new report created (for admins)
   */
  private getReportCreatedTemplate(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Reporte</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align:center; margin-bottom:16px;">
    <img src="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''}/brand/logo-nobg.png" alt="EthicVoice" width="120" />
  </div>
  <div style="background: #f7fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="color: #2d3748; margin-bottom: 20px;">📝 Nuevo Reporte Creado</h1>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
      <p><strong>Se ha creado un nuevo reporte en ${data.orgName}</strong></p>
      
      <div style="background: #edf2f7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>ID del Reporte:</strong> ${data.reportTitle}</p>
        <p style="margin: 5px 0;"><strong>Organización:</strong> ${data.orgName}</p>
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
      </div>
      
      <p>Un nuevo reporte requiere su atención. Por favor revise los detalles y tome las acciones necesarias.</p>
      
      ${data.reportUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reportUrl}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          📋 Revisar Reporte
        </a>
      </div>
      ` : ''}
      
      ${data.dashboardUrl ? `
      <div style="text-align: center; margin: 10px 0;">
        <a href="${data.dashboardUrl}" style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          📊 Ir al Dashboard
        </a>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Email template for report assignment
   */
  private getReportAssignedTemplate(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Asignado</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align:center; margin-bottom:16px;">
    <img src="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''}/brand/logo-nobg.png" alt="EthicVoice" width="120" />
  </div>
  <div style="background: #f0fff4; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="color: #2d3748; margin-bottom: 20px;">🎯 Reporte Asignado</h1>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #38a169;">
      <p><strong>Hola ${data.assigneeName},</strong></p>
      
      <p>Se le ha asignado un nuevo reporte para investigación en <strong>${data.orgName}</strong>.</p>
      
      <div style="background: #edf2f7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Reporte:</strong> ${data.reportTitle}</p>
        <p style="margin: 5px 0;"><strong>Organización:</strong> ${data.orgName}</p>
        ${data.requesterName ? `<p style="margin: 5px 0;"><strong>Asignado por:</strong> ${data.requesterName}</p>` : ''}
        <p style="margin: 5px 0;"><strong>Fecha de Asignación:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
      </div>
      
      <p>Por favor revise el reporte y tome las acciones necesarias. Recuerde mantener actualizado el estado del caso.</p>
      
      ${data.reportUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reportUrl}" style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          📋 Ver Reporte Asignado
        </a>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Email template for urgent reports
   */
  private getUrgentReportTemplate(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Urgente</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align:center; margin-bottom:16px;">
    <img src="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''}/brand/logo-nobg.png" alt="EthicVoice" width="120" />
  </div>
  <div style="background: #fff5f5; padding: 30px; border-radius: 10px; margin-bottom: 20px; border: 2px solid #f56565;">
    <h1 style="color: #c53030; margin-bottom: 20px;">🚨 REPORTE URGENTE</h1>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #e53e3e;">
      <p><strong>⚠️ ACCIÓN INMEDIATA REQUERIDA</strong></p>
      
      <p>Se ha detectado un reporte de <strong>ALTA PRIORIDAD</strong> que requiere atención inmediata en <strong>${data.orgName}</strong>.</p>
      
      <div style="background: #fed7d7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>🆔 Reporte:</strong> ${data.reportTitle}</p>
        <p style="margin: 5px 0;"><strong>🏢 Organización:</strong> ${data.orgName}</p>
        <p style="margin: 5px 0;"><strong>⏰ Detectado:</strong> ${new Date().toLocaleString('es-CO')}</p>
        <p style="margin: 5px 0; color: #c53030;"><strong>🚨 Nivel:</strong> CRÍTICO</p>
      </div>
      
      <p><strong>Este reporte ha sido marcado como crítico por nuestro sistema de análisis automático.</strong></p>
      
      <p>Se recomienda:</p>
      <ul>
        <li>📞 Revisar inmediatamente</li>
        <li>📝 Documentar acciones tomadas</li>
        <li>👥 Coordinar con el equipo correspondiente</li>
        <li>⏱️ Seguir protocolo de casos urgentes</li>
      </ul>
      
      ${data.reportUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.reportUrl}" style="background: #e53e3e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          🚨 REVISAR INMEDIATAMENTE
        </a>
      </div>
      ` : ''}
      
      ${data.dashboardUrl ? `
      <div style="text-align: center; margin: 10px 0;">
        <a href="${data.dashboardUrl}" style="background: #4a5568; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          📊 Ir al Dashboard
        </a>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generic email template
   */
  private getGenericTemplate(data: { title: string; message: string; orgName: string; actionUrl?: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align:center; margin-bottom:16px;">
    <img src="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''}/brand/logo-nobg.png" alt="EthicVoice" width="120" />
  </div>
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
    <h1 style="color: #2d3748; margin-bottom: 20px;">${data.title}</h1>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
      <p>${data.message}</p>
      
      ${data.actionUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.actionUrl}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Ver Detalles
        </a>
      </div>
      ` : ''}
      
      <p style="margin-top: 30px;">
        <strong>Atentamente,</strong><br>
        <strong>Equipo ${data.orgName}</strong>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get user notification settings
   */
  private async getUserNotificationSettings(userId: string, orgId?: string): Promise<any> {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      // Get user role to set appropriate defaults
      const userRole = await this.getUserRole(userId, orgId);
      const defaults = this.getGentleDefaults(userRole);
      
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          orgId,
          ...defaults,
        },
      });
    }

    return settings;
  }

  /**
   * Get user role (simplified version)
   */
  private async getUserRole(userId: string, orgId?: string): Promise<string> {
    try {
      if (!orgId) return 'ORG_MEMBER';
      
      const membership = await prisma.organizationMembership.findUnique({
        where: {
          userId_orgId: {
            userId,
            orgId,
          },
        },
      });

      return membership?.role === 'ADMIN' ? 'ORG_ADMIN' : 'ORG_MEMBER';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'ORG_MEMBER';
    }
  }

  /**
   * Get gentle defaults for better UX based on role
   */
  private getGentleDefaults(userRole: string) {
    const isAdmin = userRole === 'ORG_ADMIN' || userRole === 'SUPER_ADMIN';
    
    return {
      // Email notifications - more conservative by default
      emailReportCreated: false, // Off by default for better UX
      emailReportAssigned: true, // Important - keep on
      emailReportStatusChanged: false, // Off by default - can be overwhelming
      emailReportComment: false, // Off by default - can be overwhelming  
      emailSystemAlerts: false, // Off by default

      // In-app notifications - more permissive 
      inAppReportCreated: isAdmin, // Only for admins
      inAppReportAssigned: true,
      inAppReportStatusChanged: true,
      inAppReportComment: true,
      inAppSystemAlerts: isAdmin, // Only for admins

      // Digest settings - weekly by default for admins only
      enableDailyDigest: false,
      enableWeeklyDigest: isAdmin, // Only for admins by default
      digestTime: '09:00',
    };
  }

  /**
   * Check if should send email notification based on type and user settings
   */
  private shouldSendEmailNotification(type: NotificationType, settings: any, channel: NotificationChannel): boolean {
    if (channel === NotificationChannel.IN_APP) return false;
    if (!settings) return true; // Default to sending if no settings

    switch (type) {
      case NotificationType.REPORT_CREATED:
        return settings.emailReportCreated;
      case NotificationType.REPORT_ASSIGNED:
        return settings.emailReportAssigned;
      case NotificationType.REPORT_STATUS_CHANGED:
        return settings.emailReportStatusChanged;
      case NotificationType.REPORT_COMMENT_ADDED:
        return settings.emailReportComment;
      case NotificationType.SYSTEM_ALERT:
      case NotificationType.REPORT_URGENT:
        return settings.emailSystemAlerts;
      case NotificationType.EMAIL_CONFIRMATION_SENT:
        return true; // Always send confirmation emails
      default:
        return true;
    }
  }

  /**
   * Check if should send in-app notification based on type and user settings
   */
  private shouldSendInAppNotification(type: NotificationType, settings: any, channel: NotificationChannel): boolean {
    if (channel === NotificationChannel.EMAIL) return false;
    if (!settings) return true; // Default to sending if no settings

    switch (type) {
      case NotificationType.REPORT_CREATED:
        return settings.inAppReportCreated;
      case NotificationType.REPORT_ASSIGNED:
        return settings.inAppReportAssigned;
      case NotificationType.REPORT_STATUS_CHANGED:
        return settings.inAppReportStatusChanged;
      case NotificationType.REPORT_COMMENT_ADDED:
        return settings.inAppReportComment;
      case NotificationType.SYSTEM_ALERT:
      case NotificationType.REPORT_URGENT:
        return settings.inAppSystemAlerts;
      case NotificationType.EMAIL_CONFIRMATION_SENT:
        return false; // Don't send confirmation as in-app notification
      default:
        return true;
    }
  }

  /**
   * Mark notification as sent
   */
  private async markNotificationAsSent(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, page = 1, limit = 20): Promise<{
    notifications: any[];
    total: number;
    unreadCount: number;
  }> {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: {
          organization: {
            select: { name: true, slug: true },
          },
          report: {
            select: { id: true, aiSummary: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({
        where: {
          userId,
          status: { not: NotificationStatus.READ },
        },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        status: { not: NotificationStatus.READ },
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Helper methods for common notification scenarios
   */

  // Email confirmation notification
  async sendConfirmationEmail(reporterEmail: string, trackingCode: string, orgId: string): Promise<void> {
    // Create a temporary user entry for this email if needed, or use the guest notification system
    const notification: NotificationData = {
      userId: 'guest', // We'll handle this differently for external emails
      orgId,
      type: NotificationType.EMAIL_CONFIRMATION_SENT,
      title: 'Reporte Recibido',
      message: `Su reporte ha sido recibido exitosamente. Código de seguimiento: ${trackingCode}`,
      channel: NotificationChannel.EMAIL,
      metadata: { trackingCode, reporterEmail },
    };

    // Send directly via Resend for guest emails
    const { subject, html } = await this.getEmailTemplate(notification, { email: reporterEmail });

    await resend.emails.send({
      from: this.fromEmail,
      to: reporterEmail,
      subject,
      html,
    });
  }

  // Report created notification for admins
  async notifyReportCreated(reportId: number, orgId: string): Promise<void> {
    const admins = await prisma.organizationMembership.findMany({
      where: {
        orgId,
        role: 'ADMIN',
      },
      include: {
        user: true,
      },
    });

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.userId,
        orgId,
        type: NotificationType.REPORT_CREATED,
        title: 'Nuevo Reporte Creado',
        message: `Se ha creado un nuevo reporte que requiere revisión`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: NotificationChannel.BOTH,
        metadata: {
          reportTitle: `REP-${String(reportId).padStart(6, '0')}`,
        },
      });
    }
  }

  // Report assigned notification
  async notifyReportAssigned(reportId: number, assigneeId: string, assignedBy: string): Promise<void> {
    const [assignee, requester, report] = await Promise.all([
      prisma.user.findUnique({ where: { id: assigneeId } }),
      prisma.user.findUnique({ where: { id: assignedBy } }),
      prisma.formSubmission.findUnique({
        where: { id: reportId },
        include: { organization: true },
      }),
    ]);

    if (assignee && report) {
      await this.createNotification({
        userId: assigneeId,
        orgId: report.orgId,
        type: NotificationType.REPORT_ASSIGNED,
        title: 'Reporte Asignado',
        message: `Se le ha asignado el reporte REP-${String(reportId).padStart(6, '0')} para investigación`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: NotificationChannel.BOTH,
        metadata: {
          reportTitle: `REP-${String(reportId).padStart(6, '0')}`,
          requesterName: requester ? `${requester.firstName} ${requester.lastName}`.trim() : 'Admin',
        },
      });
    }
  }

  // Urgent report notification
  async notifyUrgentReport(reportId: number, orgId: string): Promise<void> {
    const admins = await prisma.organizationMembership.findMany({
      where: {
        orgId,
        role: 'ADMIN',
      },
      include: {
        user: true,
      },
    });

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.userId,
        orgId,
        type: NotificationType.REPORT_URGENT,
        title: '🚨 Reporte Crítico',
        message: `Se ha detectado un reporte de alta prioridad que requiere atención inmediata`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: NotificationChannel.BOTH,
        metadata: {
          reportTitle: `REP-${String(reportId).padStart(6, '0')}`,
        },
      });
    }
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService(); 