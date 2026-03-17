import { useCallback } from 'react';
import { notificationsService } from '../services/notifications.service';

export const useNotificationEvents = () => {
  
  // Event: New report created
  const onReportCreated = useCallback(async (reportId: number, orgId: string, reporterEmail?: string) => {
    try {
      // Send confirmation email to reporter if email is provided
      if (reporterEmail) {
        const { createTrackingCode } = await import('@/actions/tracking.actions');
        const trackingCode = await createTrackingCode(reportId);
        await notificationsService.sendConfirmationEmail(reporterEmail, trackingCode, orgId);
      }

      // Notify organization admins
      await notificationsService.notifyReportCreated(reportId, orgId);
      
    } catch (error) {
      console.error('Error sending report created notifications:', error);
    }
  }, []);

  // Event: Report assigned to member
  const onReportAssigned = useCallback(async (reportId: number, assigneeId: string, assignedBy: string) => {
    try {
      await notificationsService.notifyReportAssigned(reportId, assigneeId, assignedBy);
    } catch (error) {
      console.error('Error sending report assigned notification:', error);
    }
  }, []);

  // Event: Urgent report detected
  const onUrgentReportDetected = useCallback(async (reportId: number, orgId: string) => {
    try {
      await notificationsService.notifyUrgentReport(reportId, orgId);
    } catch (error) {
      console.error('Error sending urgent report notification:', error);
    }
  }, []);

  // Event: Report status changed
  const onReportStatusChanged = useCallback(async (
    reportId: number, 
    orgId: string, 
    newStatus: string, 
    changedBy: string,
    assigneeIds?: string[]
  ) => {
    try {
      // Notify assigned members about status changes
      if (assigneeIds && assigneeIds.length > 0) {
        for (const assigneeId of assigneeIds) {
          await notificationsService.createNotification({
            userId: assigneeId,
            orgId,
            type: 'REPORT_STATUS_CHANGED',
            title: 'Estado de Reporte Actualizado',
            message: `El reporte REP-${String(reportId).padStart(6, '0')} cambió a: ${newStatus}`,
            actionUrl: `/app/reports/${reportId}`,
            reportId,
            channel: 'IN_APP',
            metadata: {
              newStatus,
              changedBy,
              reportTitle: `REP-${String(reportId).padStart(6, '0')}`,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }, []);

  // Event: Comment added to report
  const onCommentAdded = useCallback(async (
    reportId: number,
    orgId: string,
    commentAuthor: string,
    commentPreview: string,
    assigneeIds?: string[]
  ) => {
    try {
      // Notify assigned members about new comments
      if (assigneeIds && assigneeIds.length > 0) {
        for (const assigneeId of assigneeIds) {
          await notificationsService.createNotification({
            userId: assigneeId,
            orgId,
            type: 'REPORT_COMMENT_ADDED',
            title: 'Nuevo Comentario',
            message: `${commentAuthor} agregó un comentario al reporte REP-${String(reportId).padStart(6, '0')}`,
            actionUrl: `/app/reports/${reportId}`,
            reportId,
            channel: 'IN_APP',
            metadata: {
              commentAuthor,
              commentPreview: commentPreview.substring(0, 100),
              reportTitle: `REP-${String(reportId).padStart(6, '0')}`,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error sending comment notification:', error);
    }
  }, []);

  return {
    onReportCreated,
    onReportAssigned,
    onUrgentReportDetected,
    onReportStatusChanged,
    onCommentAdded,
  };
}; 