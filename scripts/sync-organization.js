const { PrismaClient } = require("@prisma/client");
const { clerkClient } = require("@clerk/nextjs/server");

const prisma = new PrismaClient();

async function syncOrganization() {
  const orgId = "org_30vtnSHvPgJX2Jop5WDLmZMXOke";

  try {
    console.log(`🔍 Checking if organization ${orgId} exists in database...`);

    // Check if organization exists in database
    const existingOrg = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (existingOrg) {
      console.log(
        "✅ Organization already exists in database:",
        existingOrg.name
      );
      return;
    }

    console.log(
      "❌ Organization not found in database, fetching from Clerk..."
    );

    // Get organization from Clerk
    const clerk = await clerkClient();
    const clerkOrg = await clerk.organizations.getOrganization({
      organizationId: orgId,
    });

    console.log("📦 Clerk organization data:", {
      id: clerkOrg.id,
      name: clerkOrg.name,
      slug: clerkOrg.slug,
      createdBy: clerkOrg.createdBy,
    });

    // Check if the creator user exists in our database
    const userId = clerkOrg.createdBy;
    if (!userId) {
      throw new Error("Organization creator ID is missing");
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      console.log(
        "⚠️ User who created the org does not exist in database, fetching from Clerk..."
      );

      const clerkUser = await clerk.users.getUser(userId);

      // Create user in database
      await prisma.user.create({
        data: {
          id: clerkUser.id,
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
        },
      });

      console.log("✅ User created in database");
    }

    // Create organization in database
    const newOrg = await prisma.organization.create({
      data: {
        id: clerkOrg.id,
        name: clerkOrg.name,
        slug: clerkOrg.slug,
        logoUrl: clerkOrg.imageUrl,
        User: {
          connect: {
            id: userId,
          },
        },
      },
    });

    // Create admin membership
    await prisma.organizationMembership.create({
      data: {
        userId: userId,
        orgId: clerkOrg.id,
        role: "ADMIN",
      },
    });

    // Create default department
    await prisma.department.create({
      data: {
        name: "General",
        slug: "general",
        orgId: clerkOrg.id,
        isDefault: true,
      },
    });

    console.log("✅ Organization synchronized successfully:", newOrg.name);
  } catch (error) {
    console.error("❌ Error syncing organization:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncOrganization();
