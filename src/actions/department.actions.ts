"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import {
  Department,
  DepartmentWithStats,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@/types/department.types";
import { revalidatePath } from "next/cache";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function createDepartment(
  orgId: string,
  input: CreateDepartmentInput
): Promise<Department> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("No autorizado");
  }

  // Check if user is admin
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("No tienes permisos para crear departamentos");
  }

  // Generate slug if not provided
  const slug =
    input.slug ||
    input.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

  try {
    const department = await prisma.department.create({
      data: {
        name: input.name,
        slug,
        orgId,
        isDefault: input.isDefault || false,
      },
    });

    revalidatePath("/app/organization");
    revalidatePath("/app/departments");

    return department;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Ya existe un departamento con ese nombre");
    }
    throw error;
  }
}

// getDepartments/getDepartmentsWithStats take orgId as a plain argument, so
// (like team.actions.ts's getTeamMembers) they need their own membership
// check rather than trusting the caller-supplied orgId — otherwise any
// signed-in user could read any other org's department list by UUID.
async function assertOrgMembership(orgId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autorizado");

  const [membership, user] = await Promise.all([
    prisma.organizationMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    }),
    currentUser(),
  ]);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isSuper = Boolean(userEmail && isSuperAdmin(userEmail));

  if (!membership && !isSuper) throw new Error("No autorizado");

  return userId;
}

// Get all departments for an organization
export async function getDepartments(orgId: string): Promise<Department[]> {
  await assertOrgMembership(orgId);

  const departments = await prisma.department.findMany({
    where: { orgId },
    include: {
      _count: {
        select: {
          members: true,
          reports: true,
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return departments;
}

// Get departments with stats
export async function getDepartmentsWithStats(
  orgId: string
): Promise<DepartmentWithStats[]> {
  await assertOrgMembership(orgId);

  const departments = await prisma.department.findMany({
    where: { orgId },
    include: {
      _count: {
        select: {
          members: true,
          reports: true,
        },
      },
    },
  });

  // Get stats for each department
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      const [pendingReports, inProgressReports, resolvedReports] =
        await Promise.all([
          prisma.formSubmission.count({
            where: {
              departmentId: dept.id,
              status: "PENDING",
            },
          }),
          prisma.formSubmission.count({
            where: {
              departmentId: dept.id,
              status: "IN_PROGRESS",
            },
          }),
          prisma.formSubmission.count({
            where: {
              departmentId: dept.id,
              status: { in: ["RESOLVED", "CLOSED"] },
            },
          }),
        ]);

      return {
        ...dept,
        memberCount: dept._count.members,
        reportCount: dept._count.reports,
        pendingReports,
        inProgressReports,
        resolvedReports,
      };
    })
  );

  return departmentsWithStats;
}

// Update a department
export async function updateDepartment(
  departmentId: string,
  input: UpdateDepartmentInput
): Promise<Department> {
  const { userId, orgId: orgFromAuth } = await auth();
  const orgId = orgFromAuth || (await resolveOrgId());

  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }

  // Check if user is admin
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("No tienes permisos para actualizar departamentos");
  }

  // department.update's `where` only accepts a unique key (id), which on
  // its own doesn't prove this department belongs to the admin's org —
  // without this check, an admin of org A could pass a department id
  // belonging to org B and edit it directly.
  const owned = await prisma.department.findFirst({
    where: { id: departmentId, orgId },
    select: { id: true },
  });
  if (!owned) throw new Error("Departamento no encontrado");

  const department = await prisma.department.update({
    where: { id: departmentId },
    data: input,
  });

  revalidatePath("/app/organization");
  revalidatePath("/app/departments");

  return department;
}

// Delete a department (moves members to default department)
export async function deleteDepartment(departmentId: string): Promise<void> {
  const { userId, orgId: orgFromAuth } = await auth();
  const orgId = orgFromAuth || (await resolveOrgId());

  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }

  // Check if user is admin
  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    throw new Error("No tienes permisos para eliminar departamentos");
  }

  // Check if it's the default department — scoped by orgId, not just id:
  // without this, an admin of org A could pass a department id belonging
  // to org B and delete it (findUnique on id alone can't prove ownership).
  const department = await prisma.department.findFirst({
    where: { id: departmentId, orgId },
  });

  if (!department) {
    throw new Error("Departamento no encontrado");
  }

  if (department.isDefault) {
    throw new Error("No se puede eliminar el departamento predeterminado");
  }

  // Find default department
  let defaultDepartment = await prisma.department.findFirst({
    where: {
      orgId,
      isDefault: true,
    },
  });

  // Fallback: auto-provision or promote a default department if missing
  if (!defaultDepartment) {
    // Try to promote an existing "general" department if present
    const existingGeneral = await prisma.department.findFirst({
      where: { orgId, slug: "general" },
    });

    if (existingGeneral) {
      defaultDepartment = await prisma.department.update({
        where: { id: existingGeneral.id },
        data: { isDefault: true },
      });
    } else {
      // Create a new default department on the fly
      defaultDepartment = await prisma.department.create({
        data: {
          name: "General",
          slug: "general",
          orgId,
          isDefault: true,
        },
      });
    }
  }

  // Move all members to default department
  await prisma.organizationMembership.updateMany({
    where: { departmentId },
    data: { departmentId: defaultDepartment.id },
  });

  // Move all reports to default department
  await prisma.formSubmission.updateMany({
    where: { departmentId },
    data: { departmentId: defaultDepartment.id },
  });

  // Delete the department
  await prisma.department.delete({
    where: { id: departmentId },
  });

  revalidatePath("/app/organization");
  revalidatePath("/app/departments");
}

// Assign member to department
export async function assignMemberToDepartment(
  userId: string,
  departmentId: string
): Promise<void> {
  const { userId: adminId, orgId: orgFromAuth } = await auth();
  const orgId = orgFromAuth || (await resolveOrgId());

  if (!adminId || !orgId) {
    throw new Error("No autorizado");
  }

  // Check if admin
  const adminMembership = await prisma.organizationMembership.findUnique({
    where: {
      userId_orgId: {
        userId: adminId,
        orgId,
      },
    },
  });

  if (!adminMembership || adminMembership.role !== "ADMIN") {
    throw new Error("No tienes permisos para asignar miembros a departamentos");
  }

  // Department.id is globally unique, not scoped to an org — without this
  // check an admin could point a member's departmentId at another org's
  // department (it would still satisfy the FK, just silently cross tenants).
  const targetDepartment = await prisma.department.findFirst({
    where: { id: departmentId, orgId },
    select: { id: true },
  });
  if (!targetDepartment) {
    throw new Error("Departamento no encontrado");
  }

  // Update member's department
  await prisma.organizationMembership.update({
    where: {
      userId_orgId: {
        userId,
        orgId,
      },
    },
    data: { departmentId },
  });

  revalidatePath("/app/team");
  revalidatePath("/app/departments");
}
