const { PrismaClient } = require("@prisma/client");
const { clerkClient } = require("@clerk/nextjs/server");

const prisma = new PrismaClient();

async function listOrganizations() {
  try {
    console.log("📋 Listing organizations...\n");

    // Get organizations from database
    console.log("🗄️  DATABASE ORGANIZATIONS:");
    const dbOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    if (dbOrgs.length === 0) {
      console.log("   No organizations found in database");
    } else {
      dbOrgs.forEach((org) => {
        console.log(`   - ${org.name} (${org.id}) - slug: ${org.slug}`);
      });
    }

    console.log("\n☁️  CLERK ORGANIZATIONS:");

    // Get organizations from Clerk
    const clerk = await clerkClient();
    const clerkOrgs = await clerk.organizations.getOrganizationList({
      limit: 100,
    });

    if (clerkOrgs.data.length === 0) {
      console.log("   No organizations found in Clerk");
    } else {
      clerkOrgs.data.forEach((org) => {
        console.log(`   - ${org.name} (${org.id}) - slug: ${org.slug}`);
      });
    }

    console.log("\n🔄 SYNC STATUS:");
    const clerkIds = new Set(clerkOrgs.data.map((org) => org.id));
    const dbIds = new Set(dbOrgs.map((org) => org.id));

    const onlyInClerk = clerkOrgs.data.filter((org) => !dbIds.has(org.id));
    const onlyInDb = dbOrgs.filter((org) => !clerkIds.has(org.id));

    if (onlyInClerk.length > 0) {
      console.log("   Organizations in Clerk but not in DB:");
      onlyInClerk.forEach((org) => {
        console.log(`     - ${org.name} (${org.id})`);
      });
    }

    if (onlyInDb.length > 0) {
      console.log("   Organizations in DB but not in Clerk:");
      onlyInDb.forEach((org) => {
        console.log(`     - ${org.name} (${org.id})`);
      });
    }

    if (onlyInClerk.length === 0 && onlyInDb.length === 0) {
      console.log("   ✅ All organizations are synchronized");
    }
  } catch (error) {
    console.error("❌ Error listing organizations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listOrganizations();
