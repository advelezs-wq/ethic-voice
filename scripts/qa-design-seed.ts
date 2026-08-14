/**
 * One-off local QA helper: creates a throwaway Clerk user + an active-subscription
 * organization so the redesign work can be visually verified against the real
 * authenticated dashboard shell. Not for production use.
 *
 * Usage: bunx tsx scripts/qa-design-seed.ts
 */
// dotenv isn't a project dependency; Node 20.6+ can load .env natively.
try {
  process.loadEnvFile();
} catch {
  // ignore — falls back to whatever is already in process.env
}
import { createClerkClient } from "@clerk/backend";
import prisma from "../src/modules/prisma/lib/prisma";
import { PLAN_CONFIGS, PlanType } from "../src/types/subscription.types";
import { OrganizationRole } from "@prisma/client";

async function main() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  const email = `ev-design-qa+${Date.now()}@example.com`;
  const user = await clerk.users.createUser({
    emailAddress: [email],
    firstName: "QA",
    lastName: "Design",
    password: `TempQA-${Date.now()}Aa1!`,
    skipPasswordChecks: true,
  });
  console.log("Clerk user:", user.id, email);

  await prisma.user.upsert({
    where: { id: user.id },
    update: { email },
    create: { id: user.id, email, firstName: "QA", lastName: "Design" },
  });

  const org = await prisma.organization.create({
    data: {
      id: crypto.randomUUID(),
      name: "QA Design Redesign Preview",
      slug: `qa-design-preview-${Math.random().toString(36).slice(2, 8)}`,
      isActive: true,
      hasActivePlan: true,
      currentPlan: PlanType.GROW_PRO,
      subscriptionSetupCompleted: true,
    },
  });
  console.log("Organization:", org.id);

  await prisma.organizationMembership.create({
    data: { userId: user.id, orgId: org.id, role: OrganizationRole.ADMIN },
  });

  const planConfig = PLAN_CONFIGS[PlanType.GROW_PRO];
  const subscription = await prisma.subscription.create({
    data: {
      orgId: org.id,
      userId: user.id,
      planType: PlanType.GROW_PRO,
      planName: planConfig.displayName,
      billingCycle: "MONTHLY",
      status: "ACTIVE",
      startDate: new Date(),
      monthlyPrice: Number(planConfig.price?.monthly || 0) || null,
      currency: "COP",
      hasEmailChannel: planConfig.features.hasEmailChannel,
      hasAiProcessing: planConfig.features.hasAiProcessing,
      hasChatbotChannel: planConfig.features.hasChatbotChannel,
      hasPhoneChannel: planConfig.features.hasPhoneChannel,
      hasExternalManager: planConfig.features.hasExternalManager || false,
      hasBilingualSupport: planConfig.features.hasBilingualSupport || false,
      hasUnlimitedUsers: planConfig.features.hasUnlimitedUsers || false,
      hasAdvancedAnalytics: planConfig.features.hasAdvancedAnalytics || false,
      hasCustomization: planConfig.features.hasCustomization || false,
      hasColorThemes: planConfig.features.hasColorThemes || false,
      hasUnlimitedCustomization: planConfig.features.hasUnlimitedCustomization || false,
      maxUsers: planConfig.features.maxUsers,
      maxInvestigators: planConfig.features.maxInvestigators,
      maxEmployees: planConfig.features.maxEmployees,
      isTrialActive: false,
    },
  });
  console.log("Subscription:", subscription.id);

  await prisma.department.create({
    data: { name: "General", slug: "general", orgId: org.id, isDefault: true },
  });

  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: user.id,
    expiresInSeconds: 3600,
  });

  console.log("\n--- Sign-in URL (valid 1h) ---");
  console.log(`http://localhost:3000/auth/sign-in?__clerk_ticket=${signInToken.token}`);
  console.log("\n--- Cleanup ---");
  console.log(`Clerk user id: ${user.id}`);
  console.log(`Organization id: ${org.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
