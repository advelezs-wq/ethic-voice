"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import {
  Department,
  DepartmentWithStats,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@/types/department.types";
import { revalidatePath } from "next/cache";
import { resolveOrgId } from "@/modules/core/utils/org-resolver";

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

// Get all departments for an organization
export async function getDepartments(orgId: string): Promise<Department[]> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("No autorizado");
  }

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
  const { userId } = await auth();

  if (!userId) {
    throw new Error("No autorizado");
  }

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

  // Check if it's the default department
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
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

// Create default department for an organization
export async function createDefaultDepartment(
  orgId: string
): Promise<Department> {
  const department = await prisma.department.create({
    data: {
      name: "General",
      slug: "general",
      orgId,
      isDefault: true,
    },
  });

  return department;
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
