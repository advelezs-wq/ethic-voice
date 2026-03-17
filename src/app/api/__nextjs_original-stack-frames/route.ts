import { NextResponse } from "next/server";

export async function POST() {
  // Handle NextJS internal stack frame requests silently
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  // Handle GET requests silently
  return new NextResponse(null, { status: 204 });
}

export async function OPTIONS() {
  // Handle preflight requests
  return new NextResponse(null, { status: 204 });
}
