// app/api/pusher/auth/route.ts
import { pusherServer } from "@/modules/app/lib/pusher";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertUserCanAccessReport } from "@/modules/core/utils/org-resolver";

// CRITICAL: this used to have no actual authorization check at all — any
// signed-in user could authorize themselves onto ANY private-report-<id>
// channel by name alone. Combined with report.ts's chat actions broadcasting
// full messages (including internal-only notes) on that channel, and report
// ids being small sequential integers, this made every case's confidential
// investigation chat interceptable platform-wide by anyone with a session.
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

  // For private/presence channels, verify the user actually has access to
  // the underlying resource before authorizing the subscription.
  if (channelName.startsWith("private-") || channelName.startsWith("presence-")) {
    const reportMatch = channelName.match(/^(?:private|presence)-report-(\d+)$/);
    if (reportMatch) {
      const reportId = Number(reportMatch[1]);
      try {
        await assertUserCanAccessReport(reportId);
      } catch {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } else {
      // Unknown private/presence channel shape — deny by default rather
      // than authorizing something we don't recognize.
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: userId,
    user_info: {
      id: userId,
    },
  });

  return NextResponse.json(authResponse);
}
