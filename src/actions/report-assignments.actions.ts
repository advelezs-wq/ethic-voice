/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { revalidatePath } from "next/cache";
import { notificationsService } from "@/modules/app/services/notifications.service";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// A superadmin browsing "por org" has no OrganizationMembership row for
// that org — resolveOrgId() already trusts the ev_org cookie for them
// without requiring one, so these ADMIN-only actions need the same bypass
// or a superadmin can never assign/reassign/remove investigators anywhere
// they aren't a real member.
async function assertOrgAdmin(
  userId: string,
  orgId: string,
  errorMessage: string
): Promise<void> {
  const [membership, user] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));

  if (membership?.role !== "ADMIN" && !isSuper) {
    throw new Error(errorMessage);
  }
}

export interface AssignMemberInput {
  userId: string;
  userName: string;
}

export interface ConflictFlags {
  sameDepartment: boolean;
  nameMatchesAccused: boolean;
  isReporter: boolean;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

// Assign multiple members to a report
export async function assignMembersToReport(
  reportId: number,
  members: AssignMemberInput[]
): Promise<void> {
  try {
  // TEMP DEBUG wrapper — revert once diagnosed
  const { userId: currentUserId } = await auth();
  if (!currentUserId) {
    throw new Error("No autorizado");
  }

  // Derive orgId from the report itself rather than resolveOrgId()'s single
  // cookie-selected org: a superadmin browsing "Todas las Organizaciones"
  // routinely has a different org selected than whatever report they click
  // into, which made every assignment on a cross-org report fail (bogus-id
  // or "Reporte no encontrado", depending on membership overlap) instead of
  // working like the rest of the global view already does. This is also
  // strictly safer — it ties the permission check to the record actually
  // being modified instead of ambient session state.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
  });
  if (!report) {
    throw new Error("Reporte no encontrado");
  }
  const orgId = report.orgId;

  await assertOrgAdmin(currentUserId, orgId, "No tienes permisos para asignar investigadores");

  // members[].userId is caller-supplied with no other validation — without
  // this, an admin (or a Server Action call crafted outside the UI) could
  // "assign" an arbitrary Clerk user id, which itself doesn't grant that
  // user access to the report (view access separately requires real
  // OrganizationMembership), but does trigger a notification to that id
  // containing case details (title, reason) — leaking a snippet of
  // confidential case content outside the organization.
  const memberIds = members.map((m) => m.userId);
  const realMembers = await prisma.organizationMembership.findMany({
    where: { orgId, userId: { in: memberIds } },
    select: { userId: true },
  });
  const realMemberIds = new Set(realMembers.map((m) => m.userId));
  const bogusIds = memberIds.filter((id) => !realMemberIds.has(id));
  if (bogusIds.length > 0) {
    throw new Error("Uno o más usuarios no pertenecen a esta organización");
  }

    // Create assignments in a transaction
    await prisma.$transaction(async (tx) => {
      // Check if this is the first assignment for this report
      const existingAssignments = await tx.reportAssignment.findMany({
        where: { reportId },
      });

      // Create new assignments
      const assignments = members.map((member) => ({
        reportId,
        userId: member.userId,
        userName: member.userName,
        createdBy: currentUserId,
      }));

      await tx.reportAssignment.createMany({
        data: assignments,
        skipDuplicates: true, // Skip if already assigned
      });

      // If this is the first assignment and report is PENDING, change status to IN_PROGRESS
      if (existingAssignments.length === 0 && report.status === "PENDING") {
        await tx.formSubmission.update({
          where: { id: reportId },
          data: {
            status: "IN_PROGRESS",
            updatedAt: new Date(),
          },
        });

        // Log the status change
        await tx.reportActivity.create({
          data: {
            submissionId: reportId,
            action: "STATUS_CHANGED",
            details: {
              previousStatus: "PENDING",
              newStatus: "IN_PROGRESS",
              reason: "Investigadores asignados automáticamente",
              changedBy: currentUserId,
            },
            userId: currentUserId,
            userName: "Sistema Automático",
          },
        });
      }

      // Create activity log for assignment
      await tx.reportActivity.create({
        data: {
          submissionId: reportId,
          action: "MEMBERS_ASSIGNED",
          details: {
            assignedMembers: members.map((m) => ({
              id: m.userId,
              name: m.userName,
            })),
            assignedBy: currentUserId,
            count: members.length,
            statusChanged:
              existingAssignments.length === 0 && report.status === "PENDING",
          },
          userId: currentUserId,
          userName: "Current User",
        },
      });
    });

    // Send notification to each assigned member
    try {
      for (const member of members) {
        await notificationsService.notifyReportAssigned(
          reportId,
          member.userId,
          currentUserId
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending assignment notifications:",
        notificationError
      );
      // Don't fail the assignment if notifications fail
    }

    revalidatePath(`/app/reports/${reportId}`);
    revalidatePath("/app/reports");
  } catch (error) {
    console.error("Error assigning members:", error);
    // TEMP DEBUG — surfacing the real cause of a production-only failure;
    // revert this to the generic message once diagnosed.
    throw new Error(
      "DEBUG: " +
        (error instanceof Error
          ? `${error.message} :: ${error.stack?.slice(0, 800)}`
          : String(error))
    );
  }
}

// Remove a member from a report
export async function removeAssignmentFromReport(
  reportId: number,
  userId: string
): Promise<void> {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) {
    throw new Error("No autorizado");
  }

  // See assignMembersToReport — orgId comes from the report itself, not the
  // caller's cookie-selected org, so this works from the superadmin global
  // view regardless of which org happens to be currently selected.
  const report = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true },
  });
  if (!report) {
    throw new Error("Reporte no encontrado");
  }
  const orgId = report.orgId;

  await assertOrgAdmin(currentUserId, orgId, "No tienes permisos para remover investigadores");

  try {
    const assignment = await prisma.reportAssignment.findUnique({
      where: {
        reportId_userId: {
          reportId,
          userId,
        },
      },
    });

    if (!assignment) {
      throw new Error("Asignación no encontrada");
    }

    await prisma.$transaction(async (tx) => {
      // Check how many assignments exist before removal
      const totalAssignments = await tx.reportAssignment.count({
        where: { reportId },
      });

      // Get current report status
      const currentReport = await tx.formSubmission.findUnique({
        where: { id: reportId },
        select: { status: true },
      });

      // Delete assignment
      await tx.reportAssignment.delete({
        where: {
          id: assignment.id,
        },
      });

      // If this was the last assignment and report is IN_PROGRESS, change status back to PENDING
      if (totalAssignments === 1 && currentReport?.status === "IN_PROGRESS") {
        await tx.formSubmission.update({
          where: { id: reportId },
          data: {
            status: "PENDING",
            updatedAt: new Date(),
          },
        });

        // Log the status change
        await tx.reportActivity.create({
          data: {
            submissionId: reportId,
            action: "STATUS_CHANGED",
            details: {
              previousStatus: "IN_PROGRESS",
              newStatus: "PENDING",
              reason: "Último investigador removido automáticamente",
              changedBy: currentUserId,
            },
            userId: currentUserId,
            userName: "Sistema Automático",
          },
        });
      }

      // Create activity log for removal
      await tx.reportActivity.create({
        data: {
          submissionId: reportId,
          action: "MEMBER_REMOVED",
          details: {
            removedUserId: userId,
            removedUserName: assignment.userName,
            removedBy: currentUserId,
            statusChanged:
              totalAssignments === 1 && currentReport?.status === "IN_PROGRESS",
          },
          userId: currentUserId,
          userName: "Current User",
        },
      });
    });

    revalidatePath(`/app/reports/${reportId}`);
    revalidatePath("/app/reports");
  } catch (error) {
    console.error("Error removing assignment:", error);
    throw new Error("Error al remover investigador");
  }
}

// Get available members for assignment (members not already assigned)
export async function getAvailableMembersForAssignment(
  reportId: number,
  departmentId?: string,
  orgIdOverride?: string
): Promise<(AssignMemberInput & { conflict: ConflictFlags })[]> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("No autorizado");
  }

  // orgIdOverride came from a client-side prop with no server-side check
  // that the caller actually belongs to it — any authenticated user could
  // call this directly with another organization's id and get back that
  // org's full member roster (real names, emails, departments). Only trust
  // it once verified against real membership or a superadmin bypass, the
  // same check resolveOrgId() applies to the ev_org cookie.
  let orgId: string | null;
  if (orgIdOverride) {
    const [membership, user] = await Promise.all([
      prisma.organizationMembership.findUnique({
        where: { userId_orgId: { userId, orgId: orgIdOverride } },
      }),
      currentUser(),
    ]);
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));
    if (!membership && !isSuper) {
      throw new Error("No autorizado para ver esta organización");
    }
    orgId = orgIdOverride;
  } else {
    orgId = await resolveOrgId();
  }

  if (!orgId) {
    throw new Error("No autorizado");
  }

  try {
    // Get current assignments
    const currentAssignments = await prisma.reportAssignment.findMany({
      where: { reportId },
      select: { userId: true },
    });

    const assignedUserIds = currentAssignments.map((a) => a.userId);

    // Pull the report's own department + reporter/accused info so we can
    // flag likely conflicts of interest on each candidate below — an
    // investigator from the same department as the case, sharing a name
    // with the accused, or being the reporter themselves.
    const report = await prisma.formSubmission.findFirst({
      where: { id: reportId, orgId },
      select: {
        departmentId: true,
        content: true,
        isAnonymous: true,
        reporterEmail: true,
      },
    });

    let accusedName: string | null = null;
    if (report?.content) {
      try {
        const parsed = JSON.parse(report.content);
        const reported = parsed?.reported;
        if (reported?.firstName || reported?.lastName) {
          accusedName = normalizeName(
            `${reported.firstName || ""} ${reported.lastName || ""}`
          );
        }
      } catch {
        // Not JSON (e.g. raw email content) — no accused-name check possible.
      }
    }

    // Get all organization members
    const whereClause: any = {
      orgId,
      userId: {
        notIn: assignedUserIds, // Exclude already assigned
      },
      role: "MEMBER", // Only show members, not admins
    };

    // Filter by department if specified
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const members = await prisma.organizationMembership.findMany({
      where: whereClause,
      include: {
        user: true,
        department: true,
      },
    });

    return members.map((member) => {
      const userName = `${member.user.firstName || ""} ${
        member.user.lastName || member.user.email
      }`.trim();
      const normalizedMemberName = normalizeName(userName);

      const conflict: ConflictFlags = {
        sameDepartment: Boolean(
          report?.departmentId && member.departmentId === report.departmentId
        ),
        nameMatchesAccused: Boolean(
          accusedName &&
            accusedName.length > 2 &&
            normalizedMemberName === accusedName
        ),
        isReporter: Boolean(
          !report?.isAnonymous &&
            report?.reporterEmail &&
            member.user.email?.toLowerCase() ===
              report.reporterEmail.toLowerCase()
        ),
      };

      return {
        userId: member.userId,
        userName,
        department: member.department?.name,
        role: member.role,
        conflict,
      };
    });
  } catch (error) {
    console.error("Error getting available members:", error);
    return [];
  }
}

/**
 * Transfer a case from one investigator to another with a documented
 * reason, in one step (no separate remove-then-add — avoids the report
 * briefly having neither the old nor the new assignee).
 */
export async function reassignReportMember(
  reportId: number,
  fromUserId: string,
  toUserId: string,
  toUserName: string,
  reason: string
): Promise<void> {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("No autorizado");

  // See assignMembersToReport — orgId comes from the report itself.
  const reportForOrg = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true },
  });
  if (!reportForOrg) throw new Error("Reporte no encontrado");
  const orgId = reportForOrg.orgId;

  await assertOrgAdmin(currentUserId, orgId, "No tienes permisos para reasignar investigadores");

  const cleanReason = reason?.trim();
  if (!cleanReason) {
    throw new Error("Debes indicar un motivo para la reasignación");
  }

  // Same validation as assignMembersToReport — toUserId is caller-supplied
  // and otherwise unchecked, and a bogus id here still gets a notification
  // containing the case reference and the reassignment reason.
  const targetMembership = await prisma.organizationMembership.findUnique({
    where: { userId_orgId: { userId: toUserId, orgId } },
  });
  if (!targetMembership) {
    throw new Error("El usuario destino no pertenece a esta organización");
  }

  const oldAssignment = await prisma.reportAssignment.findUnique({
    where: { reportId_userId: { reportId, userId: fromUserId } },
  });
  if (!oldAssignment) throw new Error("Asignación original no encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.reportAssignment.delete({ where: { id: oldAssignment.id } });
    await tx.reportAssignment.upsert({
      where: { reportId_userId: { reportId, userId: toUserId } },
      create: {
        reportId,
        userId: toUserId,
        userName: toUserName,
        createdBy: currentUserId,
      },
      update: {},
    });
    await tx.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "CASE_REASSIGNED",
        details: {
          fromUserId,
          fromUserName: oldAssignment.userName,
          toUserId,
          toUserName,
          reason: cleanReason,
        },
        userId: currentUserId,
        userName: "Admin",
      },
    });
  });

  const reportCode = `REP-${String(reportId).padStart(6, "0")}`;
  try {
    await notificationsService.createNotification({
      userId: toUserId,
      orgId,
      type: "REPORT_ASSIGNED",
      title: "Caso reasignado a ti",
      message: `Se te reasignó el caso ${reportCode}: ${cleanReason}`,
      actionUrl: `/app/reports/${reportId}`,
      reportId,
      channel: "BOTH",
      metadata: { reassignedFrom: oldAssignment.userName, reason: cleanReason },
    });
    if (fromUserId !== currentUserId) {
      await notificationsService.createNotification({
        userId: fromUserId,
        orgId,
        type: "SYSTEM_ALERT" as any,
        title: "Caso reasignado",
        message: `El caso ${reportCode} fue reasignado a ${toUserName}: ${cleanReason}`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: "IN_APP" as any,
        metadata: { kind: "case_reassigned", reason: cleanReason },
      });
    }
  } catch (e) {
    console.error("Error notifying about reassignment:", e);
  }

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}

/**
 * Escalate a case — flags it urgent and documents who it was escalated to
 * (e.g. external counsel), without requiring that party to be an org
 * member. Purely a documentation + priority-bump action; it doesn't create
 * a ReportAssignment since the escalation target usually isn't in the org.
 */
export async function escalateReport(
  reportId: number,
  data: { reason: string; escalatedToName: string; escalatedToEmail?: string }
): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("No autorizado");

  // See assignMembersToReport — orgId comes from the report itself.
  const reportForOrg = await prisma.formSubmission.findFirst({
    where: { id: reportId },
    select: { orgId: true },
  });
  if (!reportForOrg) throw new Error("Reporte no encontrado");
  const orgId = reportForOrg.orgId;

  await assertOrgAdmin(userId, orgId, "Solo un administrador puede escalar un caso");

  const reason = data.reason?.trim();
  const escalatedToName = data.escalatedToName?.trim();
  if (!reason || !escalatedToName) {
    throw new Error("Indica a quién se escala el caso y el motivo");
  }

  const reviewerName = user.fullName || "Admin";

  await prisma.$transaction(async (tx) => {
    await tx.formSubmission.update({
      where: { id: reportId },
      data: { priority: "URGENT" },
    });
    await tx.reportActivity.create({
      data: {
        submissionId: reportId,
        action: "CASE_ESCALATED",
        details: {
          escalatedToName,
          escalatedToEmail: data.escalatedToEmail?.trim() || null,
          reason,
        },
        userId,
        userName: reviewerName,
      },
    });
  });

  const reportCode = `REP-${String(reportId).padStart(6, "0")}`;
  try {
    const admins = await prisma.organizationMembership.findMany({
      where: { orgId, role: "ADMIN" },
      select: { userId: true },
    });
    for (const admin of admins) {
      if (admin.userId === userId) continue;
      await notificationsService.createNotification({
        userId: admin.userId,
        orgId,
        type: "REPORT_URGENT",
        title: "Caso escalado",
        message: `El caso ${reportCode} fue escalado a ${escalatedToName}: ${reason}`,
        actionUrl: `/app/reports/${reportId}`,
        reportId,
        channel: "BOTH",
        metadata: { escalatedToName, reason },
      });
    }
  } catch (e) {
    console.error("Error notifying about escalation:", e);
  }

  revalidatePath(`/app/reports/${reportId}`);
  revalidatePath("/app/reports");
}
