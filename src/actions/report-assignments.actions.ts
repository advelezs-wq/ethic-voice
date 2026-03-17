/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { revalidatePath } from "next/cache";
import { notificationsService } from "@/modules/app/services/notifications.service";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

export interface AssignMemberInput {
  userId: string;
  userName: string;
}

// Assign multiple members to a report
export async function assignMembersToReport(
  reportId: number,
  members: AssignMemberInput[]
): Promise<void> {
  const { userId: currentUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!currentUserId || !orgId) {
    throw new Error("No autorizado");
  }

  // Verify user is admin
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId: currentUserId,
        orgId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("No tienes permisos para asignar investigadores");
  }

  // Verify report exists and belongs to organization
  const report = await prisma.formSubmission.findFirst({
    where: {
      id: reportId,
      orgId,
    },
  });

  if (!report) {
    throw new Error("Reporte no encontrado");
  }

  try {
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
    throw new Error("Error al asignar investigadores");
  }
}

// Remove a member from a report
export async function removeAssignmentFromReport(
  reportId: number,
  userId: string
): Promise<void> {
  const { userId: currentUserId } = await auth();
  const orgId = await resolveOrgId();

  if (!currentUserId || !orgId) {
    throw new Error("No autorizado");
  }

  // Verify user is admin
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId: currentUserId,
        orgId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("No tienes permisos para remover investigadores");
  }

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
): Promise<AssignMemberInput[]> {
  const { userId } = await auth();
  const orgId = orgIdOverride ?? (await resolveOrgId());

  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }

  try {
    // Get current assignments
    const currentAssignments = await prisma.reportAssignment.findMany({
      where: { reportId },
      select: { userId: true },
    });

    const assignedUserIds = currentAssignments.map((a) => a.userId);

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

    return members.map((member) => ({
      userId: member.userId,
      userName: `${member.user.firstName || ""} ${
        member.user.lastName || member.user.email
      }`.trim(),
      department: member.department?.name,
      role: member.role,
    }));
  } catch (error) {
    console.error("Error getting available members:", error);
    return [];
  }
}
