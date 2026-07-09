/**
 * Diagnóstico puntual: muestra las membresías y roles de un usuario y de la
 * organización FINANZCLUB para verificar el punto 9 de los ajustes.
 *
 * Uso: bunx tsx scripts/check-user-role.ts [email]
 */
import prisma from "@/modules/prisma/lib/prisma";

const email = process.argv[2] || "alexnius_054@hotmail.com";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    include: {
      memberships: {
        include: { organization: { select: { id: true, name: true } } },
      },
    },
  });
  if (users.length === 0) {
    console.log(`No se encontró usuario con email ${email}`);
  }
  for (const u of users) {
    console.log(`Usuario ${u.id} <${u.email}>`);
    for (const m of u.memberships) {
      console.log(
        `  - org: ${m.organization.name} (${m.orgId}) rol=${m.role} desde=${m.createdAt.toISOString()}`
      );
    }
  }

  const finanz = await prisma.organization.findMany({
    where: { name: { contains: "FINANZ", mode: "insensitive" } },
    include: { memberships: { include: { user: { select: { email: true } } } } },
  });
  for (const o of finanz) {
    console.log(`Organización ${o.name} (${o.id})`);
    for (const m of o.memberships) {
      console.log(
        `  - ${m.user?.email} rol=${m.role} desde=${m.createdAt.toISOString()}`
      );
    }
  }

  const invites = await prisma.organizationInvitation.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { orgId: true, role: true, status: true, createdAt: true },
  });
  console.log("Invitaciones:", JSON.stringify(invites, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
