import prisma from '@/modules/prisma/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface DigestData {
  hasActivity: boolean;
  newReportsCount: number;
  assignedReportsCount: number;
  statusChangesCount: number;
  notificationsCount: number;
  newReports?: Array<{
    id: number;
    createdAt: Date;
    assignments: Array<{ userId: string }>;
  }>;
  assignedReports?: Array<{
    id: number;
    createdAt: Date;
  }>;
  statusChanges?: Array<{
    id: number;
    updatedAt: Date;
  }>;
  period?: {
    startDate: Date;
    endDate: Date;
  };
}

export class DigestService {
  private fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@ethicvoice.co";

  /**
   * Send daily digest to users who have it enabled
   */
  async sendDailyDigests(): Promise<void> {
    try {
      console.log('Starting daily digest processing...');
      
      // Get users with daily digest enabled
      const usersWithDailyDigest = await prisma.notificationSettings.findMany({
        where: {
          enableDailyDigest: true,
        },
        include: {
          organization: true,
        },
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      for (const userSettings of usersWithDailyDigest) {
        await this.sendUserDigest(userSettings.userId, userSettings.orgId, 'daily', yesterday, now);
      }

      console.log(`Daily digest sent to ${usersWithDailyDigest.length} users`);
    } catch (error) {
      console.error('Error sending daily digests:', error);
      throw error;
    }
  }

  /**
   * Send weekly digest to users who have it enabled
   */
  async sendWeeklyDigests(): Promise<void> {
    try {
      console.log('Starting weekly digest processing...');
      
      // Get users with weekly digest enabled
      const usersWithWeeklyDigest = await prisma.notificationSettings.findMany({
        where: {
          enableWeeklyDigest: true,
        },
        include: {
          organization: true,
        },
      });

      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      for (const userSettings of usersWithWeeklyDigest) {
        await this.sendUserDigest(userSettings.userId, userSettings.orgId, 'weekly', lastWeek, now);
      }

      console.log(`Weekly digest sent to ${usersWithWeeklyDigest.length} users`);
    } catch (error) {
      console.error('Error sending weekly digests:', error);
      throw error;
    }
  }

  /**
   * Send digest for a specific user
   */
  private async sendUserDigest(
    userId: string,
    orgId: string | null,
    digestType: 'daily' | 'weekly',
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    try {
      // Get user email from Clerk or your user system
      // For now, we'll try to get it from notifications or other means
      const userNotifications = await prisma.notification.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!userNotifications) {
        console.log(`No notifications found for user ${userId}, skipping digest`);
        return;
      }

      // Get activity data for the digest
      const digestData = await this.getDigestData(userId, orgId, startDate, endDate);

      if (!digestData.hasActivity) {
        console.log(`No activity for user ${userId} in ${digestType} period, skipping digest`);
        return;
      }

      // Get user email (you might need to integrate with Clerk API here)
      const userEmail = await this.getUserEmail(userId);
      if (!userEmail) {
        console.log(`No email found for user ${userId}, skipping digest`);
        return;
      }

      // Generate and send the digest email
      await this.sendDigestEmail(userEmail, digestType, digestData);

    } catch (error) {
      console.error(`Error sending ${digestType} digest for user ${userId}:`, error);
    }
  }

  /**
   * Get digest data for a user
   */
  private async getDigestData(userId: string, orgId: string | null, startDate: Date, endDate: Date): Promise<DigestData> {
    try {
      // Get new reports in the period
      const newReports = await prisma.formSubmission.findMany({
        where: {
          orgId: orgId || undefined,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Limit to recent 10
        include: {
          assignments: {
            where: { userId },
          },
        },
      });

      // Get assigned reports
      const assignedReports = newReports.filter(report => report.assignments.length > 0);

      // Get status changes
      const statusChanges = await prisma.formSubmission.findMany({
        where: {
          orgId: orgId || undefined,
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
          assignments: {
            some: { userId },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });

      // Get new notifications
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: { not: 'FAILED' },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const hasActivity = newReports.length > 0 || statusChanges.length > 0 || notifications.length > 0;

      return {
        hasActivity,
        newReportsCount: newReports.length,
        assignedReportsCount: assignedReports.length,
        statusChangesCount: statusChanges.length,
        notificationsCount: notifications.length,
        newReports: newReports.slice(0, 5), // Top 5 for email
        assignedReports: assignedReports.slice(0, 3), // Top 3 for email
        statusChanges: statusChanges.slice(0, 3), // Top 3 for email
        period: {
          startDate,
          endDate,
        },
      };
          } catch (error) {
        console.error('Error getting digest data:', error);
        return { 
          hasActivity: false,
          newReportsCount: 0,
          assignedReportsCount: 0,
          statusChangesCount: 0,
          notificationsCount: 0
        };
      }
  }

  /**
   * Get user email from Clerk
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        console.log(`✅ Found email for user ${userId}: ${email}`);
        return email;
      } else {
        console.log(`⚠️ No email found for user ${userId}`);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error getting email for user ${userId}:`, errorMessage);
      return null;
    }
  }

  /**
   * Send the actual digest email
   */
  private async sendDigestEmail(
    userEmail: string,
    digestType: 'daily' | 'weekly',
    digestData: DigestData
  ): Promise<void> {
    try {
      const subject = `${digestType === 'daily' ? 'Resumen Diario' : 'Resumen Semanal'} - EthicVoice`;
      
      const htmlContent = this.generateDigestHTML(digestType, digestData);

      await resend.emails.send({
        from: this.fromEmail,
        to: userEmail,
        subject,
        html: htmlContent,
      });

      console.log(`${digestType} digest sent to ${userEmail}`);
    } catch (error) {
      console.error(`Error sending ${digestType} digest email:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML content for digest email
   */
  private generateDigestHTML(digestType: 'daily' | 'weekly', digestData: DigestData): string {
    const periodText = digestType === 'daily' ? 'últimas 24 horas' : 'última semana';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Resumen ${digestType === 'daily' ? 'Diario' : 'Semanal'} - EthicVoice</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
            .stat-card { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
            .report-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .report-item:last-child { border-bottom: none; }
            .highlight { color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Resumen ${digestType === 'daily' ? 'Diario' : 'Semanal'}</h1>
              <p>Tu actividad en EthicVoice durante ${periodText}</p>
            </div>
            
            <div class="content">
              <h2>📈 Estadísticas del Período</h2>
              
              ${digestData.newReportsCount > 0 ? `
                <div class="stat-card">
                  <strong class="highlight">${digestData.newReportsCount}</strong> nuevos reportes creados
                </div>
              ` : ''}
              
              ${digestData.assignedReportsCount > 0 ? `
                <div class="stat-card">
                  <strong class="highlight">${digestData.assignedReportsCount}</strong> reportes asignados a ti
                </div>
              ` : ''}
              
              ${digestData.statusChangesCount > 0 ? `
                <div class="stat-card">
                  <strong class="highlight">${digestData.statusChangesCount}</strong> cambios de estado en tus reportes
                </div>
              ` : ''}
              
              ${digestData.notificationsCount > 0 ? `
                <div class="stat-card">
                  <strong class="highlight">${digestData.notificationsCount}</strong> notificaciones recibidas
                </div>
              ` : ''}

              ${digestData.assignedReports && digestData.assignedReports.length > 0 ? `
                <h3>📋 Reportes Asignados Recientemente</h3>
                ${digestData.assignedReports.map((report: { id: number; createdAt: Date }) => `
                  <div class="report-item">
                    <strong>Reporte #${report.id}</strong><br>
                    <small>Creado: ${new Date(report.createdAt).toLocaleDateString('es-ES')}</small>
                  </div>
                `).join('')}
              ` : ''}

              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://ethicvoice.co'}/app" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ver Dashboard Completo
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><small>Este es tu resumen ${digestType === 'daily' ? 'diario' : 'semanal'} automático de EthicVoice.</small></p>
              <p><small>Puedes modificar tus preferencias de notificaciones en tu <a href="${process.env.NEXTAUTH_URL || 'https://ethicvoice.co'}/app/profile">perfil</a>.</small></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const digestService = new DigestService(); 