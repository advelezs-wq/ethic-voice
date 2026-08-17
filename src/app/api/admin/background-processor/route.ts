/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { backgroundProcessor } from "@/modules/app/lib/background-processor";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

function verifyAdminApiKey(request: NextRequest): boolean {
  const apiKey =
    request.headers.get("x-admin-api-key") ||
    request.headers.get("authorization")?.replace("Bearer ", "");
  const expectedApiKey = process.env.ADMIN_API_KEY;
  if (!expectedApiKey) return false;
  return apiKey === expectedApiKey;
}

export async function POST(request: NextRequest) {
  try {
    // This retries failed AI jobs across every organization on the
    // platform, not just the caller's — "any logged-in user" was not
    // nearly strict enough. Require the admin key/cron header, or an
    // actual platform superadmin.
    const isCron = request.headers.get("x-vercel-cron");
    if (!isCron && !verifyAdminApiKey(request)) {
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;
      if (!userEmail || !isSuperAdmin(userEmail)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("🎯 Manual background processor trigger requested");

    // Run the background processor
    await backgroundProcessor.processFailedJobs();

    // Get current stats
    const stats = await backgroundProcessor.getStats();

    return NextResponse.json({
      success: true,
      message: "Background processor completed",
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Background processor API error:", error);
    return NextResponse.json(
      {
        error: "Background processor failed",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current stats without processing
    const stats = await backgroundProcessor.getStats();

    return NextResponse.json({
      stats,
      isHealthy: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Background processor stats error:", error);
    return NextResponse.json(
      {
        error: "Failed to get stats",
        details: error?.message,
        isHealthy: false,
      },
      { status: 500 }
    );
  }
}
