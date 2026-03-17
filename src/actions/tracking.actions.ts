"use server";

import prisma from "@/modules/prisma/lib/prisma";

export interface PublicReportData {
  id: string;
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
          take: 50, // Limit activities for performance
        },
        assignments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!submission) return null;

    // Format the tracking code
    const trackingCode = await createTrackingCode(submission.id);

    // Filter activities to only show public-safe information
    const publicActivities = submission.activities
      .map((activity) => {
        let publicAction = activity.action;

        // Sanitize action descriptions
        switch (activity.action) {
          case "report_submitted":
            publicAction = "Denuncia recibida";
            break;
          case "status_changed":
            publicAction = "Estado actualizado";
            break;
          case "investigator_assigned":
            publicAction = "Investigador asignado";
            break;
          case "investigation_started":
            publicAction = "Investigación iniciada";
            break;
          case "evidence_reviewed":
            publicAction = "Evidencia revisada";
            break;
          case "report_resolved":
            publicAction = "Caso resuelto";
            break;
          case "report_closed":
            publicAction = "Caso cerrado";
            break;
          default:
            // Hide internal actions
            if (
              activity.action.includes("internal") ||
              activity.action.includes("comment") ||
              activity.action.includes("note")
            ) {
              return null;
            }
            publicAction = "Actualización del caso";
        }

        return {
          id: activity.id,
          action: publicAction,
          createdAt: activity.createdAt.toISOString(),
          details: activity.details,
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
