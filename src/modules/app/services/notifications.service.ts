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
  receivedAt?: string;
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
          subject: `Nueva denuncia pendiente de revisión - ${orgName}`,
          html: this.getReportCreatedTemplate({
            orgName,
            reportTitle: data.metadata?.reportTitle || `REP-${String(reportId).padStart(6, '0')}`,
            reportUrl: reportId ? `${baseUrl}/app/reports/${reportId}` : `${baseUrl}/app/reports`,
            receivedAt: formatBogotaDateTime(
              data.metadata?.receivedAt ? new Date(data.metadata.receivedAt) : new Date()
            ),
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
    // Deliberately carries no report content (category, description, people
    // involved, reporter): only the org, the receipt date and a link that
    // requires signing in.
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || ''}/brand/logo-nobg.png`;
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva denuncia pendiente de revisión</title>
</head>
<body style="margin:0; padding:0; background:#f4f3ef; font-family: Arial, Helvetica, sans-serif; color:#0b1d21;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:12px; overflow:hidden;">
        <tr><td style="padding:28px 32px 0; text-align:center;">
          <img src="${logoUrl}" alt="EthicVoice" width="150" style="display:inline-block; max-width:150px; height:auto;" />
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#0b1d21;">Tienes una nueva denuncia pendiente de revisión</h1>
          <p style="margin:0; font-size:15px; line-height:1.6; color:#3d5257;">
            Se registró un nuevo reporte en el canal ético de <strong>${escapeHtml(data.orgName || '')}</strong>. Ingresa a EthicVoice para revisarlo.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef; border-radius:8px;">
            <tr><td style="padding:14px 18px; font-size:14px; line-height:1.7; color:#0b1d21;">
              <strong>Organización:</strong> ${escapeHtml(data.orgName || '')}<br>
              <strong>Fecha de recepción:</strong> ${escapeHtml(data.receivedAt || '')}<br>
              <strong>Referencia:</strong> ${escapeHtml(data.reportTitle || '')}
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:12px 32px 28px;">
          <a href="${data.reportUrl}" style="display:inline-block; background:#0b1d21; color:#ffffff; text-decoration:none; font-weight:bold; font-size:15px; padding:14px 28px; border-radius:999px;">
            Ingresar a EthicVoice
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 28px; font-size:12px; line-height:1.6; color:#6b7c80; border-top:1px solid #e7e5df;">
          <p style="margin:16px 0 0;">Por confidencialidad, este correo no incluye el contenido de la denuncia. Solo los usuarios autorizados pueden consultarlo dentro de la plataforma.</p>
          <p style="margin:8px 0 0;">Recibes este aviso porque eres administrador de ${escapeHtml(data.orgName || '')} en EthicVoice.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
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
      emailReportCreated: true, // New reports must reach admins (only admins get it)
      emailReportAssigned: true, // Important - keep on
      emailReportStatusChanged: false, // Off by default - can be overwhelming
      emailReportComment: false, // Off by default - can be overwhelming  
      emailSystemAlerts: true, // Urgent-report alerts (only admins get them)

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
        // Mandatory: only org admins get it, and an ethics line that doesn't
        // tell its admins a report arrived is broken. Old settings rows still
        // carry emailReportCreated=false from the previous default, so the
        // stored preference is deliberately ignored here.
        return true;
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

  // Everything that should happen as soon as a channel saves a new report:
  // confirm receipt to an identified reporter and alert the org's admins.
  // Called on creation rather than after AI analysis, which can fail or be
  // outside the org's plan. Never throws — the report is already saved.
  async notifyReportReceived(report: {
    id: number;
    orgId: string;
    trackingToken: string;
    reporterEmail?: string | null;
    isAnonymous?: boolean | null;
  }): Promise<void> {
    if (report.reporterEmail && !report.isAnonymous) {
      try {
        await this.sendConfirmationEmail(
          report.reporterEmail,
          `REP-${report.trackingToken}`,
          report.orgId
        );
      } catch (error) {
        console.error(`Error sending confirmation for report ${report.id}:`, error);
      }
    }

    try {
      await this.notifyReportCreated(report.id, report.orgId);
    } catch (error) {
      console.error(`Error notifying admins of report ${report.id}:`, error);
    }
  }

  // Notify a non-anonymous reporter by email that the team replied on their
  // report's public chat. Anonymous reporters have no email on file, so the
  // "new message" signal for them lives entirely on the /track/[code] page.
  async notifyReporterOfNewMessage(params: {
    reporterEmail: string;
    trackingCode: string;
    orgName: string;
    messagePreview: string;
  }): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const html = this.getGenericTemplate({
      title: "Tienes un nuevo mensaje del equipo",
      message: `El equipo de ${params.orgName} respondió en tu denuncia (${params.trackingCode}): "${params.messagePreview}". Ingresa a tu enlace de seguimiento para leer el mensaje completo y responder.`,
      orgName: params.orgName,
      actionUrl: `${baseUrl}/track/${params.trackingCode}`,
    });

    await resend.emails.send({
      from: this.fromEmail,
      to: params.reporterEmail,
      subject: `Nuevo mensaje sobre tu denuncia ${params.trackingCode}`,
      html,
    });
  }

  // Report created notification for admins
  async notifyReportCreated(reportId: number, orgId: string): Promise<void> {
    const [admins, report] = await Promise.all([
      prisma.organizationMembership.findMany({
        where: {
          orgId,
          role: 'ADMIN',
        },
        include: {
          user: true,
        },
      }),
      prisma.formSubmission.findUnique({
        where: { id: reportId },
        select: { createdAt: true },
      }),
    ]);

    if (admins.length === 0) {
      console.warn(`[NOTIFY] Org ${orgId} has no admins to notify of report ${reportId}`);
    }

    // One admin's failure (bad address, DB hiccup) must not stop the rest.
    for (const admin of admins) {
      try {
        await this.createNotification({
          userId: admin.userId,
          orgId,
          type: NotificationType.REPORT_CREATED,
          title: 'Nueva denuncia recibida',
          message: `Tienes un nuevo reporte pendiente de revisión`,
          actionUrl: `/app/reports/${reportId}`,
          reportId,
          channel: NotificationChannel.BOTH,
          metadata: {
            reportTitle: `REP-${String(reportId).padStart(6, '0')}`,
            receivedAt: (report?.createdAt ?? new Date()).toISOString(),
          },
        });
      } catch (error) {
        console.error(
          `[NOTIFY] Failed to notify admin ${admin.userId} of report ${reportId}:`,
          error
        );
      }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "7 de noviembre de 2026, 3:42 p. m." in Colombia time. */
export function formatBogotaDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}
