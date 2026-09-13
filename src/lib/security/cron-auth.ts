import { currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

// Shared authentication for internal/cron-triggered admin endpoints
// (/api/admin/*, /api/digest/*, /api/ai/requeue/*).
//
// CRITICAL: every one of these routes used to treat the mere *presence* of an
// `x-vercel-cron` (or, in proxy.ts, `x-vercel-signature`) request header as
// proof the request came from Vercel's own Cron scheduler. Neither header is
// stripped or verified by Vercel's edge on the way in — any caller can set
// them on a plain request — which is exactly why Vercel added the CRON_SECRET
// mechanism in the first place: when CRON_SECRET is configured as a project
// env var, Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>`
// to requests it sends to trigger your Cron Jobs
// (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
// That header is the only real signal that a request genuinely came from
// Vercel's scheduler. Some of the endpoints gated this way perform
// destructive operations (org hard-deletion in maintenance/route.ts,
// case-data deletion in case-retention/route.ts), so this was a real,
// unauthenticated way to trigger them.
//
// This checks for either:
//  - Authorization: Bearer <CRON_SECRET>  (genuine Vercel Cron invocation)
//  - x-admin-api-key: <ADMIN_API_KEY>, or Authorization: Bearer <ADMIN_API_KEY>
//    (manual/internal server-to-server calls, e.g. daily-runner orchestrating
//    its sibling endpoints)
// Fails closed: returns false whenever the relevant secret isn't configured,
// rather than falling back to trusting an unverifiable header.
export function verifyCronOrAdminRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.replace(/^Bearer\s+/i, "").trim();

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && bearer === cronSecret) {
    return true;
  }

  const adminApiKey = process.env.ADMIN_API_KEY;
  if (adminApiKey) {
    const apiKeyHeader = request.headers.get("x-admin-api-key");
    if (apiKeyHeader === adminApiKey || bearer === adminApiKey) {
      return true;
    }
  }

  return false;
}

// Same as verifyCronOrAdminRequest, plus a fallback for a signed-in platform
// superadmin using the panel directly (e.g. /app/superadmin/tools's
// "Procesar Colas" button) — that request carries a Clerk session cookie,
// not a CRON_SECRET/ADMIN_API_KEY header, so verifyCronOrAdminRequest alone
// always rejected it even for the operator the tool was built for.
export async function verifyCronAdminOrSuperAdmin(
  request: Request
): Promise<boolean> {
  if (verifyCronOrAdminRequest(request)) return true;
  const email = (await currentUser())?.primaryEmailAddress?.emailAddress;
  return Boolean(email && isSuperAdmin(email));
}
