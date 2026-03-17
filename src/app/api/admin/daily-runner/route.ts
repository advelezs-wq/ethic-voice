import { NextRequest, NextResponse } from "next/server";

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
  const base = getBaseUrl(request.url);
  const results: Record<string, unknown> = {};
  // Propaga cabecera de cron a este endpoint también para que el middleware lo detecte
  // Vercel la incluirá automáticamente en la invocación del cron job

  // 1) Validación de planes/estado
  results.validatePlans = await callJson(
    new URL("/api/admin/security/validate-plans", base).toString(),
    {
      headers: { "x-vercel-cron": "1" },
    }
  );

  // 2) Mantenimiento (avisos/eliminación diferida)
  results.maintenance = await callJson(
    new URL("/api/admin/maintenance", base).toString(),
    {
      headers: { "x-vercel-cron": "1" },
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
        headers: { Authorization: `Bearer ${token}`, "x-vercel-cron": "1" },
      }
    );
  }

  // 4) Procesar colas (permitimos sin API key indicando cabecera de cron)
  results.processQueue = await callJson(
    new URL("/api/admin/process-queue", base).toString(),
    {
      method: "POST",
      headers: { "x-vercel-cron": "1" },
    }
  );

  // 5) SLA alerts (near-due/overdue)
  results.slaAlerts = await callJson(
    new URL("/api/admin/security/sla-alerts", base).toString(),
    {
      method: "POST",
      headers: { "x-vercel-cron": "1" },
    }
  );

  return NextResponse.json({ ok: true, results });
}
