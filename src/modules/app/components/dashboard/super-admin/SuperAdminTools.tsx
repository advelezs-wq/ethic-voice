"use client";

import React, { useState } from "react";
import { Button, Card, CardBody, Code, Spinner } from "@heroui/react";

export default function SuperAdminTools() {
  const [log, setLog] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (label: string, url: string, opts?: RequestInit) => {
    setLoading(label);
    setLog("");
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      setLog(text || `${res.status} ${res.statusText}`);
    } catch (e: any) {
      setLog(e?.message || "Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="text-xl font-semibold">Herramientas de Super Admin</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onPress={() => run("daily-digests", "/api/digest/daily", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_DIGEST_TOKEN || ""}` } })}
            isLoading={loading === "daily-digests"}
          >
            Ejecutar Daily Digest
          </Button>
          <Button
            onPress={() => run("weekly-digests", "/api/digest/weekly", { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_DIGEST_TOKEN || ""}` } })}
            isLoading={loading === "weekly-digests"}
          >
            Ejecutar Weekly Digest
          </Button>
          <Button
            onPress={() =>
              run("process-queue", "/api/admin/process-queue", {
                method: "POST",
                headers: { "x-vercel-cron": "1" },
              })
            }
            isLoading={loading === "process-queue"}
          >
            Procesar Colas
          </Button>
          <Button
            onPress={() => run("daily-runner", "/api/admin/daily-runner", { headers: { "x-vercel-cron": "1" } })}
            isLoading={loading === "daily-runner"}
          >
            Daily Runner (Secuencia)
          </Button>
        </div>
        {loading && <Spinner label={`Ejecutando ${loading}...`} />}
        <div>
          <Code className="whitespace-pre-wrap w-full">
            {log || "Salida aparecerá aquí..."}
          </Code>
        </div>
      </CardBody>
    </Card>
  );
}


