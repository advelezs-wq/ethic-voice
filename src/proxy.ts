// proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { checkPlanRestrictions } from "@/modules/core/middleware/plan-restrictions.middleware";
import {
  getRequestHost,
  PUBLIC_BLOG_PATH_HEADER,
  PUBLIC_BLOG_REQUEST_HEADER,
  signPublicBlogMarker,
} from "@/lib/public-blog";
import { preflightPublicBlog } from "@/lib/public-blog-preflight";

const PUBLIC_BLOG_PREFLIGHT_TIMEOUT_MS = 3000;

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/api(.*)", // gate all APIs, unrestricted routes will be skipped earlier
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/about",
  "/privacidad",
  "/auth/sign-in(.*)",
  "/auth/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/semsei/revalidate",
  "/api/submit/secure(.*)",
  "/api/payments(.*)", // Payment routes are public for signup flow
  "/api/subscriptions(.*)", // Subscription routes need to be accessible during signup
  "/submit(.*)",
  "/track(.*)",
]);

const isPublicBlogRoute = createRouteMatcher([
  "/en/blogs/(.*)",
  "/es/blogs/(.*)",
]);

// Routes that should skip plan restrictions (mainly webhooks and auth)
const isUnrestrictedRoute = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/submit(.*)",
  "/api/track(.*)",
  "/api/upload(.*)", // Upload endpoints for public form submissions
  "/api/payments(.*)", // All payment routes are unrestricted for signup flow
  "/api/subscriptions(.*)", // Subscription management is unrestricted
  "/api/users/org-status",
  // Onboarding bootstrap APIs (must work even if DB account not yet initialized)
  "/api/organizations(.*)",
  "/api/organization/settings(.*)",
  "/api/organization/settings/update(.*)",
  "/api/organization/(.*)/plan-info(.*)",
  "/api/notifications(.*)",
  "/api/debug(.*)", // Debug routes are unrestricted
  "/auth(.*)",
  "/checkout(.*)", // Checkout flow should be unrestricted
  "/api/cron(.*)", // Cron runner endpoints are unrestricted
  "/api/admin/daily-runner", // Allow manual run from Vercel UI without API key
  "/api/admin/security/validate-plans", // Allow cron/manual run without user session
  "/api/organization/invitations/accept(.*)", // Allow invite acceptance redirect when unauthenticated
]);

// Admin routes that can use API key authentication
const isAdminRoute = createRouteMatcher([
  "/api/admin(.*)",
  // /api/ai/requeue implements its own verifyAdminApiKey check, but without
  // being listed here the global Clerk guard below rejects it with 401
  // before that check ever runs — the API-key path was unreachable.
  "/api/ai/requeue(.*)",
]);

// Function to verify admin API key
function verifyAdminApiKey(req: Request): boolean {
  const apiKey =
    req.headers.get("x-admin-api-key") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  const expectedApiKey = process.env.ADMIN_API_KEY;

  if (!expectedApiKey) {
    console.error("❌ ADMIN_API_KEY not configured in environment variables");
    return false;
  }

  return apiKey === expectedApiKey;
}

function sanitizeRequest(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete(PUBLIC_BLOG_REQUEST_HEADER);
  requestHeaders.delete(PUBLIC_BLOG_PATH_HEADER);

  return new NextRequest(req, { headers: requestHeaders });
}

function nextWithPublicBlogMarker(
  req: Request,
  marker?: string,
  pathname?: string,
) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete(PUBLIC_BLOG_REQUEST_HEADER);
  requestHeaders.delete(PUBLIC_BLOG_PATH_HEADER);
  if (marker && pathname) {
    requestHeaders.set(PUBLIC_BLOG_REQUEST_HEADER, marker);
    requestHeaders.set(PUBLIC_BLOG_PATH_HEADER, pathname);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  // Skip proxy entirely for public routes
  if (isPublicRoute(req)) {
    return nextWithPublicBlogMarker(req);
  }

  // Skip proxy entirely for unrestricted routes (including checkout)
  if (isUnrestrictedRoute(req)) {
    return nextWithPublicBlogMarker(req);
  }

  const { userId } = await auth();

  // Check for admin routes with API key authentication
  if (isAdminRoute(req)) {
    const isVercelCron =
      req.headers.get("x-vercel-cron") || req.headers.get("x-vercel-signature");
    if (isVercelCron) {
      // Allow Vercel Cron to hit admin endpoints without Clerk/Auth
      return nextWithPublicBlogMarker(req);
    }
    if (verifyAdminApiKey(req)) {
      // Valid API key, allow access to admin route
      console.log(
        "✅ [PROXY] Admin API key verified, allowing access to:",
        req.nextUrl.pathname
      );
      return nextWithPublicBlogMarker(req);
    }
    // Invalid or missing API key, fall through to Clerk authentication
    console.log(
      "❌ [PROXY] Invalid or missing admin API key for:",
      req.nextUrl.pathname
    );
  }

  // For protected routes, check if user is NOT authenticated
  if (isProtectedRoute(req) && !userId) {
    // Para APIs, devolver 401 en lugar de redirect
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Para páginas, hacer redirect
    const signInUrl = new URL("/auth/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // For authenticated users on protected routes, check plan restrictions
  if (userId && isProtectedRoute(req)) {
    // 0) Hard gate: require DB presence (user + org) for app pages and protected APIs
    //    Skip for unrestricted routes (e.g., onboarding bootstrap APIs) to avoid deadlocks
    if (!isUnrestrictedRoute(req)) {
      try {
        const statusUrl = new URL("/api/users/org-status", req.url);
        const res = await fetch(statusUrl.toString(), {
          headers: { cookie: req.headers.get("cookie") || "" },
        });
        if (res.ok) {
          const data = (await res.json()) as {
            dbUserExists?: boolean;
            dbHasOrganizations?: boolean;
            isSuperAdmin?: boolean;
          };
          const isApi = req.nextUrl.pathname.startsWith("/api/");
          const isOnboardingPath =
            req.nextUrl.pathname.startsWith("/app/onboarding");
          const isStrictlyProtected = !isOnboardingPath;

          if (
            !data?.isSuperAdmin &&
            isStrictlyProtected &&
            (!data?.dbUserExists || !data?.dbHasOrganizations)
          ) {
            if (isApi) {
              return NextResponse.json(
                { error: "Forbidden: account not initialized in database" },
                { status: 403 }
              );
            }
            const redirectUrl = new URL("/app/onboarding", req.url);
            return NextResponse.redirect(redirectUrl);
          }
        }
      } catch (e) {
        // On errors, do not block; subsequent checks may catch edge cases
      }
    }

    // 1) Force onboarding until organization is created
    try {
      const pathname = req.nextUrl.pathname;
      const isOnboardingPath = pathname.startsWith("/app/onboarding");
      const isAppPage =
        pathname.startsWith("/app") && !pathname.startsWith("/api/");
      if (isAppPage && !isOnboardingPath) {
        const statusUrl = new URL("/api/users/org-status", req.url);
        const res = await fetch(statusUrl.toString(), {
          headers: { cookie: req.headers.get("cookie") || "" },
        });
        if (res.ok) {
          const data = (await res.json()) as { needsOnboarding?: boolean };
          if (data?.needsOnboarding) {
            const redirectUrl = new URL("/app/onboarding", req.url);
            return NextResponse.redirect(redirectUrl);
          }
        }
      }
    } catch (error) {
      console.error("[PROXY] Onboarding enforcement error:", error);
      // continue to plan restrictions on error
    }

    // 2) Plan restrictions
    try {
      const planRestrictionResponse = await checkPlanRestrictions(req, userId);

      if (planRestrictionResponse) {
        // Plan restriction blocked the request
        return planRestrictionResponse;
      }
    } catch (error) {
      console.error("Error checking plan restrictions:", error);
      // Continue on error to avoid breaking the platform
    }
  }

  // For authenticated users, let them through
  return nextWithPublicBlogMarker(req);
});

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const sanitizedRequest = sanitizeRequest(req);
  if (isPublicBlogRoute(sanitizedRequest)) {
    const preflight = await preflightPublicBlog(
      sanitizedRequest.nextUrl.pathname,
      getRequestHost(sanitizedRequest.headers),
      {
        apiKey: process.env.SEMSEI_API_KEY,
        apiUrl: process.env.SEMSEI_API_URL || "https://app.semsei.io",
        fetch,
        timeoutMs: PUBLIC_BLOG_PREFLIGHT_TIMEOUT_MS,
      },
    );
    if (preflight.status === "not-found") {
      return new NextResponse("Not Found", {
        status: 404,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }
    if (preflight.status === "bad-gateway") {
      return new NextResponse("Bad Gateway", {
        status: 502,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }

    const marker = await signPublicBlogMarker(
      preflight.context,
      process.env.CLERK_SECRET_KEY,
    );
    if (marker) {
      return nextWithPublicBlogMarker(
        sanitizedRequest,
        marker,
        preflight.context.pathname,
      );
    }

    return new NextResponse("Bad Gateway", {
      status: 502,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }

  return clerkHandler(sanitizedRequest, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Do not let protected app paths with static-looking extensions bypass marker cleanup.
    "/app(.*)",
    // Localized article slugs may intentionally end in static-looking extensions.
    "/en/blogs/:path*",
    "/es/blogs/:path*",
  ],
};
