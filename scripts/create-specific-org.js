const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createSpecificOrganization() {
  const specificOrgId = "org_30vtnSHvPgJX2Jop5WDLmZMXOke";
  const userEmail = "advelezs@gmail.com";

  try {
    console.log(`🏢 Creating specific organization: ${specificOrgId}`);

    // First create/update the user
    const user = await prisma.user.upsert({
      where: {
        email: userEmail,
      },
      update: {},
      create: {
        id: "user_30vYELDI03D6S9tp1mh0sZKEp6g", // Matching the user ID from logs
        email: userEmail,
        firstName: "Andres",
        lastName: "Velez",
        hasCompletedOrgSetup: true,
      },
    });

    console.log("✅ User created/found:", user.email);

    // Create the specific organization
    const organization = await prisma.organization.upsert({
      where: {
        id: specificOrgId,
      },
      update: {},
      create: {
        id: specificOrgId,
        name: "EthicVoice Organization",
        slug: "ethicvoice-org",
        logoUrl: null,
        User: {
          connect: { id: user.id },
        },
      },
    });

    console.log(
      "✅ Organization created:",
      organization.name,
      `(${organization.id})`
    );

    // Create admin membership
    await prisma.organizationMembership.upsert({
      where: {
        userId_orgId: {
          userId: user.id,
          orgId: organization.id,
        },
      },
      update: {
        role: "ADMIN",
      },
      create: {
        userId: user.id,
        orgId: organization.id,
        role: "ADMIN",
      },
    });

    console.log("✅ Admin membership created/updated");

    // Create default department
    await prisma.department.upsert({
      where: {
        orgId_slug: {
          orgId: organization.id,
          slug: "general",
        },
      },
      update: {},
      create: {
        name: "General",
        slug: "general",
        orgId: organization.id,
        isDefault: true,
      },
    });

    console.log("✅ Default department created");

    // Create a few sample departments
    const sampleDepartments = [
      { name: "Recursos Humanos", slug: "recursos-humanos" },
      { name: "Finanzas", slug: "finanzas" },
      { name: "Administración", slug: "administracion" },
      { name: "Logística", slug: "logistica" },
      { name: "Atención al Cliente", slug: "atencion-cliente" },
    ];

    for (const dept of sampleDepartments) {
      await prisma.department.upsert({
        where: {
          orgId_slug: {
            orgId: organization.id,
            slug: dept.slug,
          },
        },
        update: {},
        create: {
          name: dept.name,
          slug: dept.slug,
          orgId: organization.id,
          isDefault: false,
        },
      });
    }

    console.log("✅ Sample departments created");

    console.log("\n🎉 Organization setup complete!");
    console.log(`Organization ID: ${organization.id}`);
    console.log(`Organization Name: ${organization.name}`);
    console.log(`User Email: ${user.email}`);
    console.log("\n✅ Your dashboard should now work correctly!");
  } catch (error) {
    console.error("❌ Error creating organization:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSpecificOrganization();
