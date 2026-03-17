/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { backgroundProcessor } from "@/modules/app/lib/background-processor";

export async function POST() {
  try {
    // Optional: Add authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
