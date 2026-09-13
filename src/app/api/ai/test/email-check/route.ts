import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { emailQueue } from "@/modules/app/lib/queue/queue-manager";

// Same Clerk-orgId bug as ai/health/route.ts (this app doesn't use Clerk
// Organizations, so that was always undefined, making this endpoint always
// 401 for everyone). The job it queues ("check_all") isn't scoped to a
// single org anyway — it's a platform-wide email check — so this is gated
// on superadmin rather than just fixed to use resolveOrgId(), matching its
// actual behavior and its home on the internal /app/debug/ai-system page.
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const requesterEmail = (await currentUser())?.primaryEmailAddress?.emailAddress;
    if (!requesterEmail || !isSuperAdmin(requesterEmail)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Forzar una revisión de emails ahora
    const job = await emailQueue.add(
      "test-email-check",
      { type: "check_all" },
      {
        delay: 0, // Ejecutar inmediatamente
      }
    );

    return NextResponse.json({
      success: true,
      message: "Revisión de emails forzada",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error forzando revisión" },
      { status: 500 }
    );
  }
}
