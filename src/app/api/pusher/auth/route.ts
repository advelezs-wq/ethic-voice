// app/api/pusher/auth/route.ts
import { pusherServer } from "@/modules/app/lib/pusher";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // For private channels, verify user has access
  if (
    channelName.startsWith("private-") ||
    channelName.startsWith("presence-")
  ) {
    // Add your authorization logic here
    // For example, check if user has access to the report
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: userId,
    user_info: {
      id: userId,
    },
  });

  return NextResponse.json(authResponse);
}
