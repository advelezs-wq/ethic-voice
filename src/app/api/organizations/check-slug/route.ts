import { checkOrganizationSlugAvailability } from "@/modules/prisma/lib/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const available = await checkOrganizationSlugAvailability(slug);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 }
    );
  }
}
