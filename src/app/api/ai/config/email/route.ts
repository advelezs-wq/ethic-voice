import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import prisma from "@/modules/prisma/lib/prisma";

const EmailConfigSchema = z.object({
  subjectKeywords: z.array(z.string()).min(1),
  autoProcess: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const config = await prisma.emailConfiguration.findUnique({
      where: { orgId },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error obteniendo configuración" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = EmailConfigSchema.parse(body);

    const config = await prisma.emailConfiguration.update({
      where: { orgId },
      data: validatedData,
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error actualizando configuración" },
      { status: 500 }
    );
  }
}
