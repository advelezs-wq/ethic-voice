import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!userId) {
    const acceptUrl = new URL("/api/organization/invitations/accept", req.url);
    if (token) acceptUrl.searchParams.set("token", token);

    // Prefer sign-up so new users are created and then returned here
    const signUp = new URL("/auth/sign-up", req.url);
    signUp.searchParams.set("redirect_url", acceptUrl.toString());
    return NextResponse.redirect(signUp);
  }

  if (!token) return NextResponse.redirect(new URL("/app", req.url));

  const invite = await prisma.organizationInvitation.findUnique({
    where: { token },
  });
  if (
    !invite ||
    invite.status !== "pending" ||
    (invite.expiresAt && invite.expiresAt < new Date())
  ) {
    return NextResponse.redirect(new URL("/app?invite=invalid", req.url));
  }

  // Ensure user in DB (email may differ; we trust logged-in user)
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: invite.email },
  });

  // Add membership (idempotent via upsert unique on userId/orgId)
  const membership = await prisma.organizationMembership.upsert({
    where: { userId_orgId: { userId, orgId: invite.orgId } },
    update: { role: invite.role },
    create: { userId, orgId: invite.orgId, role: invite.role },
  });

  // Ensure member has default department General
  try {
    let defaultDept = await prisma.department.findFirst({
      where: { orgId: invite.orgId, isDefault: true },
    });
    if (!defaultDept) {
      defaultDept = await prisma.department.upsert({
        where: { orgId_slug: { orgId: invite.orgId, slug: "general" } },
        update: { isDefault: true },
        create: { orgId: invite.orgId, name: "General", slug: "general", isDefault: true },
      });
    }
    await prisma.organizationMembership.update({
      where: { id: membership.id },
      data: { departmentId: defaultDept.id },
    });
  } catch {}

  // Mark invite accepted
  await prisma.organizationInvitation.update({
    where: { id: invite.id },
    data: { status: "accepted" },
  });

  // Set active organization cookie to ensure immediate context
  const redirect = NextResponse.redirect(new URL(`/app`, req.url));
  redirect.cookies.set("ev_org", invite.orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return redirect;
}
