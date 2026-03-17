import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { emailQueue } from "@/modules/app/lib/queue/queue-manager";

export async function POST() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
