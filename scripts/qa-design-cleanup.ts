/**
 * One-off cleanup: removes the throwaway "QA Design Redesign Preview" orgs created by
 * scripts/qa-design-seed.ts while verifying the dashboard redesign. All child relations
 * (memberships, subscriptions, departments, settings) cascade-delete with the org.
 *
 * Usage: bunx tsx scripts/qa-design-cleanup.ts
 */
try {
  process.loadEnvFile();
} catch {
  // ignore — falls back to whatever is already in process.env
}
import prisma from "../src/modules/prisma/lib/prisma";

async function main() {
  const orgs = await prisma.organization.findMany({
    where: { slug: { startsWith: "qa-design-preview-" } },
    select: { id: true, name: true, slug: true },
  });

  if (orgs.length === 0) {
    console.log("No QA design preview orgs found.");
    return;
  }

  console.log(`Found ${orgs.length} QA design preview org(s):`);
  for (const org of orgs) {
    console.log(`  - ${org.name} (${org.slug}) [${org.id}]`);
  }

  for (const org of orgs) {
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`Deleted ${org.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
