const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestOrganization() {
  try {
    console.log("🏢 Creating test organization...");

    // First create a test user
    const testUser = await prisma.user.upsert({
      where: {
        email: "advelezs@gmail.com",
      },
      update: {},
      create: {
        id: "user_test_admin",
        email: "advelezs@gmail.com",
        firstName: "Test",
        lastName: "Admin",
        hasCompletedOrgSetup: true,
      },
    });

    console.log("✅ Test user created/found:", testUser.email);

    // Create test organization
    const testOrg = await prisma.organization.upsert({
      where: {
        slug: "test-organization",
      },
      update: {},
      create: {
        id: "org_test_organization_123",
        name: "Test Organization",
        slug: "test-organization",
        logoUrl: null,
        User: {
          connect: { id: testUser.id },
        },
      },
    });

    console.log(
      "✅ Test organization created:",
      testOrg.name,
      `(${testOrg.id})`
    );

    // Create admin membership
    await prisma.organizationMembership.upsert({
      where: {
        userId_orgId: {
          userId: testUser.id,
          orgId: testOrg.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        orgId: testOrg.id,
        role: "ADMIN",
      },
    });

    console.log("✅ Admin membership created");

    // Create default department
    await prisma.department.upsert({
      where: {
        orgId_slug: {
          orgId: testOrg.id,
          slug: "general",
        },
      },
      update: {},
      create: {
        name: "General",
        slug: "general",
        orgId: testOrg.id,
        isDefault: true,
      },
    });

    console.log("✅ Default department created");

    console.log("\n🎉 Test organization setup complete!");
    console.log(`Organization ID: ${testOrg.id}`);
    console.log(`Organization Slug: ${testOrg.slug}`);
    console.log(`User Email: ${testUser.email}`);

    console.log("\n💡 To use this organization:");
    console.log(
      `1. Update your frontend to use organization ID: ${testOrg.id}`
    );
    console.log(
      `2. Make sure your user email ${testUser.email} matches your Clerk user`
    );
  } catch (error) {
    console.error("❌ Error creating test organization:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrganization();
