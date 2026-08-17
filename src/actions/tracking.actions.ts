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
    // "REP-" + a 12-char opaque token (see trackingToken on FormSubmission)
    // — not the sequential id, which would make every report on the
    // platform enumerable by guessing REP-000001, REP-000002...
    const match = code.match(/REP-([A-Za-z0-9]{12})/);
    if (!match) return null;

    const token = match[1].toUpperCase();

    const submission = await prisma.formSubmission.findUnique({
      where: { trackingToken: token },
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

    const trackingCode = `REP-${submission.trackingToken}`;

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

// Builds the code reporters use at /track/[code] — every caller of this
// hands it to the actual reporter (submission success screen, manual-report
// creation, confirmation emails), so it must be the opaque trackingToken,
// never the sequential id. Internal dashboard displays (REP-000123 labels in
// the team UI, PDFs, notification titles) intentionally build that sequential
// format inline elsewhere — those are authenticated-only, so enumeration
// doesn't apply, and there's no reason to touch every one of those call sites.
export async function createTrackingCode(
  submissionId: number
): Promise<string> {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    select: { trackingToken: true },
  });
  if (!submission) {
    throw new Error(`Cannot build tracking code: submission ${submissionId} not found`);
  }
  return `REP-${submission.trackingToken}`;
}
