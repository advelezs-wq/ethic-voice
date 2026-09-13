import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { verifyCronOrAdminRequest } from "@/lib/security/cron-auth";

// Runs 5 downstream tasks sequentially, including process-queue which now
// waits up to 50s for AI jobs to complete — give the chain room to finish.
export const maxDuration = 120;

function getBaseUrl(reqUrl?: string): string {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (appBase) return appBase;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  if (reqUrl) {
    try {
      const u = new URL(reqUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* noop */
    }
  }
  return "http://localhost:3000";
}

async function callJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { ok: res.ok, status: res.status, body } as const;
}

export async function GET(request: NextRequest) {
  // CRITICAL: this orchestrator used to attach a plain x-vercel-cron header
  // to every downstream call and trust that same header on its own entry —
  // that header isn't verified/stripped by Vercel on inbound requests, so
  // anyone could set it and trigger this (and everything it chains into,
  // including destructive org/case deletion) with no credentials at all.
  // verifyCronOrAdminRequest requires a real secret (CRON_SECRET, which
  // Vercel automatically sends as a Bearer token for its own Cron
  // invocations, or ADMIN_API_KEY).
  if (!verifyCronOrAdminRequest(request)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;
    if (!userEmail || !isSuperAdmin(userEmail)) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }
  }

  const base = getBaseUrl(request.url);
  const results: Record<string, unknown> = {};
  const adminAuthHeader = { Authorization: `Bearer ${process.env.ADMIN_API_KEY || ""}` };

  // 1) Validación de planes/estado
  results.validatePlans = await callJson(
    new URL("/api/admin/security/validate-plans", base).toString(),
    {
      method: "POST",
      headers: adminAuthHeader,
    }
  );

  // 2) Mantenimiento (avisos/eliminación diferida)
  results.maintenance = await callJson(
    new URL("/api/admin/maintenance", base).toString(),
    {
      headers: adminAuthHeader,
    }
  );

  // 3) Digest diario
  // Daily digest requires bearer token
  {
    const token = process.env.DIGEST_CRON_TOKEN || "";
    results.digestDaily = await callJson(
      new URL("/api/digest/daily", base).toString(),
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  // 4) Procesar colas
  results.processQueue = await callJson(
    new URL("/api/admin/process-queue", base).toString(),
    {
      method: "POST",
      headers: adminAuthHeader,
    }
  );

  // 5) SLA alerts (near-due/overdue)
  results.slaAlerts = await callJson(
    new URL("/api/admin/security/sla-alerts", base).toString(),
    {
      method: "POST",
      headers: adminAuthHeader,
    }
  );

  // 6) Case-level data retention enforcement (per-org policy, legal hold aware)
  results.caseRetention = await callJson(
    new URL("/api/admin/case-retention", base).toString(),
    {
      method: "POST",
      headers: adminAuthHeader,
    }
  );

  return NextResponse.json({ ok: true, results });
}
