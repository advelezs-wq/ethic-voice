import prisma from "@/modules/prisma/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // If requester is SUPER ADMIN, return all organizations
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    if (userEmail && isSuperAdmin(userEmail)) {
      const organizations = await prisma.organization.findMany({
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ organizations });
    }

    // Otherwise, return organizations where the user is a member
    const organizations = await prisma.organization.findMany({
      where: {
        memberships: { some: { userId } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ organizations });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, logoUrl, brandColor } = body || {};
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const toSlug = (s: string) =>
      String(s)
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 48);

    const finalSlug =
      slug && slug.length > 0
        ? toSlug(slug)
        : `${toSlug(name)}-${Math.random().toString(36).slice(2, 8)}`;

    // Create organization in DB
    const organization = await prisma.organization.create({
      data: {
        id: crypto.randomUUID(),
        name,
        slug: finalSlug,
        logoUrl: logoUrl || null,
        brandColor: brandColor || null,
        isActive: true,
      },
    });

    // Ensure default department "General" exists
    try {
      await prisma.department.create({
        data: {
          name: "General",
          slug: "general",
          orgId: organization.id,
          isDefault: true,
        },
      });
    } catch (e: any) {
      // Ignore unique constraint errors if already created
    }

    // Ensure user exists in DB
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "" },
    });

    // Add creator as ADMIN member
    await prisma.organizationMembership.create({
      data: {
        userId,
        orgId: organization.id,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ organization });
  } catch {
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
