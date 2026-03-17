import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, createClerkClient } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { OrganizationRole } from "@prisma/client";
import { Resend } from "resend";

async function getClerk() {
  if (typeof clerkClient === "function") return (await clerkClient()) as any;
  if (clerkClient) return clerkClient as any;
  return createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clerk = await getClerk();
    const me = await clerk.users.getUser(userId);
    const myEmail = me?.emailAddresses?.[0]?.emailAddress;
    if (!myEmail || !isSuperAdmin(myEmail)) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    const {
      email,
      name,
      organizationName,
      planType,
      password,
      requirePasswordReset,
      inviteInstead,
    } = await req.json();
    if (!email || !organizationName || !planType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedPlan = (planType as string).toUpperCase() as keyof typeof PlanType;
    const selectedPlan = PlanType[normalizedPlan];
    if (!selectedPlan) return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });

    // 1) Resolve or create user depending on strategy
    const existingUsers = await clerk.users.getUserList({ emailAddress: [email] }).catch(() => [] as any[]);
    let targetUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;
    let createdTempPassword: string | null = null;

    // Derive first/last names to satisfy Clerk config requiring both
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0] || "User";
    const last = parts.slice(1).join(" ") || "Client";

    // Ensure password meets typical Clerk policies if we need to create the user
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;
    const makeStrongPassword = () =>
      Math.random().toString(36).slice(-8) + "Aa1!" + Math.random().toString(36).slice(-4);

    if (!inviteInstead && !targetUser) {
      // Create user directly so invitation acceptance or sign-in links the intended email
      // Clerk requires a password for email/password users. If not provided, generate a temp one.
      let tempPassword = password || makeStrongPassword();
      if (!strongPasswordRegex.test(tempPassword)) {
        tempPassword = makeStrongPassword();
      }
      try {
        targetUser = await clerk.users.createUser({
          emailAddress: [email],
          firstName: first,
          lastName: last,
          password: tempPassword,
        });
        createdTempPassword = password ? null : tempPassword;
      } catch (err) {
        // If user already exists (422), fetch again
        try {
          const retryUsers = await clerk.users.getUserList({ emailAddress: [email] });
          targetUser = retryUsers?.[0] || null;
        } catch {}
        if (!targetUser) {
          throw err;
        }
      }
      // Optionally force password reset by creating a reset ticket the first time they log in
      // Note: We enforce password reset in-app on first login; skipping Clerk ticket here to avoid 422s
    }

    // 2) Create organization in DB (no Clerk organization)
    const toSlug = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 48);
    const slug = `${toSlug(organizationName)}-${Math.random().toString(36).slice(2, 8)}`;
    const org = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name: organizationName,
        slug,
        isActive: true,
        hasActivePlan: true,
        currentPlan: selectedPlan,
      },
    });

    // 3) Add user as ADMIN member if user exists in Clerk, else send invite via Resend
    if (targetUser?.id) {
      await prisma.organizationMembership.upsert({
        where: { userId_orgId: { userId: targetUser.id, orgId: org.id } },
        update: { role: OrganizationRole.ADMIN },
        create: { userId: targetUser.id, orgId: org.id, role: OrganizationRole.ADMIN },
      });
    } else {
      const token = crypto.randomUUID();
      await prisma.organizationInvitation.create({
        data: {
          orgId: org.id,
          email,
          invitedById: userId,
          role: OrganizationRole.ADMIN,
          token,
          status: "pending",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      const resend = new Resend(process.env.RESEND_API_KEY);
      const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
      const acceptUrl = `${base}/api/organization/invitations/accept?token=${encodeURIComponent(token)}`;
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@ethicvoice.co",
        to: email,
        subject: `Invitación a ${organizationName} en EthicVoice`,
        html: `<div style="text-align:center;margin-bottom:16px;"><img src="${base}/brand/logo-nobg.png" alt="EthicVoice" width="120"/></div><p>Has sido invitado(a) a unirte como Administrador a ${organizationName}.</p><p><a href="${acceptUrl}" style="background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Aceptar invitación</a></p>`,
      });
    }

    // 3b) Ensure super admin (creator) is member/admin of the new org (DB only)
    const meEmail = me?.emailAddresses?.[0]?.emailAddress || "";
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: meEmail },
      create: { id: userId, email: meEmail },
    });
    await prisma.organizationMembership.upsert({
      where: { userId_orgId: { userId, orgId: org.id } },
      update: { role: OrganizationRole.ADMIN },
      create: { userId, orgId: org.id, role: OrganizationRole.ADMIN },
    });

    // Slug ya generado arriba

    // 4) Org already created above

    const planConfig = PLAN_CONFIGS[selectedPlan];

    // 5) Ensure DB user exists when we have a Clerk user (satisfy FK for subscription.userId)
    if (targetUser?.id) {
      try {
        await prisma.user.upsert({
          where: { id: targetUser.id },
          update: {
            email: targetUser.emailAddresses?.[0]?.emailAddress || email,
            firstName: targetUser.firstName || first,
            lastName: targetUser.lastName || last,
          },
          create: {
            id: targetUser.id,
            email: targetUser.emailAddresses?.[0]?.emailAddress || email,
            firstName: targetUser.firstName || first,
            lastName: targetUser.lastName || last,
          },
        });
      } catch (e) {
        // Continue; if this fails we will still set userId to null below to avoid FK issues
      }
    }

    // 6) Create ACTIVE subscription in DB (manual payment handled outside)
    const monthlyPrice = Number(planConfig.price?.monthly || 0);
    const subscription = await prisma.subscription.create({
      data: {
        orgId: org.id,
        userId: targetUser?.id || null,
        planType: selectedPlan,
        planName: planConfig.displayName,
        billingCycle: "MONTHLY",
        status: "ACTIVE",
        startDate: new Date(),
        // Persist price so UI can show correct amount instead of 0
        monthlyPrice: monthlyPrice > 0 ? (monthlyPrice as any) : null,
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

    // 6b) Backfill a paid transaction for manual subscription so billing shows real amount
    try {
      if (monthlyPrice > 0) {
        await prisma.paymentTransaction.create({
          data: {
            orgId: org.id,
            subscriptionId: Number(subscription.id),
            amount: monthlyPrice as any,
            currency: "COP",
            status: "SUCCEEDED",
            gateway: "OTHER",
            providerTransactionId: `manual-${subscription.id}`,
            transactionDate: new Date(),
          },
        });
      }
    } catch {}

    // Ensure default department "General"
    try {
      await prisma.department.create({
        data: {
          name: "General",
          slug: "general",
          orgId: org.id,
          isDefault: true,
        },
      });
    } catch (e: any) {
      // Ignore if already exists
    }

    // Assign default department to created/added admins
    try {
      const defaultDept = await prisma.department.findFirst({ where: { orgId: org.id, isDefault: true } });
      if (defaultDept) {
        await prisma.organizationMembership.updateMany({
          where: { orgId: org.id, role: "ADMIN", departmentId: null },
          data: { departmentId: defaultDept.id },
        });
      }
    } catch {}

    // 7) Initialize org settings
    await prisma.organizationSettings.upsert({
      where: { organizationId: org.id },
      update: {},
      create: {
        organizationId: org.id,
        theme: "default",
        primaryColor: "#0066CC",
        secondaryColor: "#4A90E2",
        accentColor: "#E3F2FD",
        backgroundColor: "#F8FAFC",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, organizationId: org.id, subscriptionId: subscription.id, tempPassword: createdTempPassword });
  } catch (error) {
    // Try to surface Clerk backend error details
    const anyErr = error as any;
    console.error("❌ [SUPERADMIN] Manual client creation failed:", anyErr);
    const message = anyErr?.errors?.[0]?.message || anyErr?.message || "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


