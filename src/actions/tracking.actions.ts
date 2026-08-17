"use server";

import prisma from "@/modules/prisma/lib/prisma";

export interface PublicReportData {
  id: string;
  reportId: number;
  status: string;
  submissionDate: string;
  organizationName: string;
  type: string | null;
  lastUpdate: string;
  description: string;
  activities: PublicActivity[];
}

interface PublicActivity {
  id: number;
  action: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

// Allowlist, not a denylist: every OTHER ReportActivity action in this
// codebase (task/update create-edit-delete, custom investigator notes,
// attachment uploads with their Cloudinary URL, priority/category/subject
// edits, admin notes, comments...) carries investigator-internal content —
// sometimes literal free-text notes about the accused — in its `details`.
// getReportByTrackingCode is unauthenticated and reachable by guessing a
// sequential 6-digit code, so anything not named here must never reach the
// public payload, full stop. Keys are matched case-insensitively since
// callers are inconsistent about UPPER_SNAKE_CASE vs lower_snake_case.
const PUBLIC_ACTIVITY_LABELS: Record<string, string> = {
  report_submitted: "Denuncia recibida",
  created_manually: "Denuncia recibida",
  status_changed: "Estado actualizado",
  investigator_assigned: "Investigador asignado",
  investigation_started: "Investigación iniciada",
  evidence_reviewed: "Evidencia revisada",
  report_resolved: "Caso resuelto",
  report_closed: "Caso cerrado",
};

export async function getReportByTrackingCode(
  code: string
): Promise<PublicReportData | null> {
  try {
    // Extract the numeric ID from the tracking code (e.g., "REP-000001" -> 1)
    const match = code.match(/REP-(\d{6})/);
    if (!match) return null;

    const reportId = parseInt(match[1], 10);

    const submission = await prisma.formSubmission.findUnique({
      where: { id: reportId },
      include: {
        organization: true,
        activities: {
          orderBy: { createdAt: "desc" },
          // Most ReportActivity rows are investigator-internal (tasks,
          // custom notes, comments, attachments) and get filtered out below
          // by PUBLIC_ACTIVITY_LABELS — an active investigation can easily
          // log 50+ internal entries between two genuinely public ones, so
          // this needs real headroom or the public timeline goes stale.
          take: 200,
        },
        assignments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!submission) return null;

    // Format the tracking code
    const trackingCode = await createTrackingCode(submission.id);

    // Only forward activities on the public allowlist above — and even for
    // those, only forward `details` for report_submitted's static system
    // message (never user/investigator-authored free text).
    const publicActivities = submission.activities
      .map((activity) => {
        const normalizedAction = activity.action.toLowerCase();
        const publicAction = PUBLIC_ACTIVITY_LABELS[normalizedAction];
        if (!publicAction) return null;

        let details: PublicActivity["details"] = null;
        if (
          normalizedAction === "report_submitted" &&
          activity.details &&
          typeof activity.details === "object"
        ) {
          const raw = activity.details as Record<string, unknown>;
          if (typeof raw.description === "string") {
            details = { description: raw.description };
          }
        }

        return {
          id: activity.id,
          action: publicAction,
          createdAt: activity.createdAt.toISOString(),
          details,
        };
      })
      .filter(Boolean) as PublicActivity[];

    // Add assignment activities if any
    if (submission.assignments.length > 0) {
      submission.assignments.forEach((assignment) => {
        publicActivities.push({
          id: -assignment.createdAt.getTime(), // Negative ID to avoid conflicts
          action: "Investigador asignado",
          createdAt: assignment.createdAt.toISOString(),
          details: null,
        });
      });
    }

    // Sort all activities by date
    publicActivities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get the latest activity description
    const latestActivity = publicActivities[0];
    const description = latestActivity
      ? latestActivity.action
      : "Sin actualizaciones";

    return {
      id: trackingCode,
      reportId: submission.id,
      status: submission.status.toLowerCase(),
      submissionDate: submission.submittedAt.toISOString(),
      organizationName: submission.organization.name,
      type: submission.type || "Denuncia general",
      lastUpdate:
        latestActivity?.createdAt || submission.updatedAt.toISOString(),
      description,
      activities: publicActivities,
    };
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
}

export async function createTrackingCode(
  submissionId: number
): Promise<string> {
  // Using the same format as generateReportReference
  return `REP-${String(submissionId).padStart(6, "0")}`;
}
