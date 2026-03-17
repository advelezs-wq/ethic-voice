import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient, createClerkClient } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";

// ✅ Helper function to get Clerk client safely
async function getClerkClient() {
  try {
    // Try default clerkClient first (supports function form)
    if (typeof clerkClient === "function") {
      const client = await clerkClient();
      if (
        client &&
        typeof (client as any).organizations?.getOrganization === "function"
      ) {
        return client as any;
      }
    } else if (
      clerkClient &&
      typeof (clerkClient as any).organizations?.getOrganization === "function"
    ) {
      return clerkClient as any;
    }

    // Fallback: create new client instance
    console.log("🔄 Creating new Clerk client instance...");
    const client = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

    return client;
  } catch (error) {
    console.error("❌ Failed to get Clerk client:", error);
    return null;
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const body = await req.json();
    const nameInput: string | undefined = body?.name ?? undefined;
    const logoUrl: string | null | undefined = body?.logoUrl ?? undefined;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Fetch current org to fill missing fields
    const currentOrg = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true },
    });

    if (!currentOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const nextName = (nameInput && nameInput.trim()) || currentOrg.name;

    console.log("🏢 [UPDATE-ORG] Starting organization update:", {
      orgId,
      name: nextName,
      logoUrl: logoUrl ?? "<unchanged>",
      updatedBy: userId,
    });

    // Skip Clerk updates: we no longer sync orgs to Clerk

    // Update in database
    console.log("🗄️ [UPDATE-ORG] Updating in database...");

    const updatedOrganization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: nextName,
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        updatedAt: new Date(),
      },
    });

    console.log("🎉 [UPDATE-ORG] Organization updated successfully");

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      organization: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        logoUrl: updatedOrganization.logoUrl,
        slug: updatedOrganization.slug,
        updatedAt: updatedOrganization.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ [UPDATE-ORG] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
