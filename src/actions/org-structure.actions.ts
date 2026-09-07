"use server";

import prisma from "@/modules/prisma/lib/prisma";
import {
  DEPARTMENTS,
  POSITIONS,
} from "@/modules/submit/constants/ethicline.constants";

// Usado por la sección de administración (Configuración Avanzada →
// Estructura de la organización). Si la organización todavía no tiene
// catálogo propio, se siembra con la lista global por defecto la primera
// vez que un admin abre la sección, para que no empiece en blanco.
export async function getAreaOptionsForAdmin(orgId: string) {
  const count = await prisma.organizationAreaOption.count({ where: { orgId } });
  if (count === 0) {
    await prisma.organizationAreaOption.createMany({
      data: DEPARTMENTS.map((label, i) => ({ orgId, label, sortOrder: i })),
    });
  }
  return prisma.organizationAreaOption.findMany({
    where: { orgId },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

export async function getPositionOptionsForAdmin(orgId: string) {
  const count = await prisma.organizationPositionOption.count({
    where: { orgId },
  });
  if (count === 0) {
    await prisma.organizationPositionOption.createMany({
      data: POSITIONS.map((label, i) => ({ orgId, label, sortOrder: i })),
    });
  }
  return prisma.organizationPositionOption.findMany({
    where: { orgId },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}

// Usado por el formulario público de denuncias. Si la organización nunca
// configuró su propio catálogo (Starter, o Grow/Grow Pro que aún no abrió la
// sección), cae de vuelta a la lista global por defecto — nunca queda vacío.
export async function getPublicAreaOptions(orgId: string): Promise<string[]> {
  const rows = await prisma.organizationAreaOption.findMany({
    where: { orgId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { label: true },
  });
  return rows.length > 0 ? rows.map((r) => r.label) : DEPARTMENTS;
}

export async function getPublicPositionOptions(
  orgId: string
): Promise<string[]> {
  const rows = await prisma.organizationPositionOption.findMany({
    where: { orgId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { label: true },
  });
  return rows.length > 0 ? rows.map((r) => r.label) : POSITIONS;
}
