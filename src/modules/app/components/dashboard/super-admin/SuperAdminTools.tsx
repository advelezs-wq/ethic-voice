"use client";

import React, { useState } from "react";
import { Button, Card, CardBody, Chip, Code, Spinner } from "@heroui/react";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { ConfirmActionModal } from "./ConfirmActionModal";

interface PendingToolAction {
  label: string;
  url: string;
  opts?: RequestInit;
  title: string;
  description: string;
  confirmLabel: string;
  riskLevel: "low" | "medium" | "high";
}

export default function SuperAdminTools() {
  const [log, setLog] = useState<string>("");
  const [loading, setLoading] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingToolAction | null>(null);

  const run = async (label: string, url: string, opts?: RequestInit) => {
    setLoading(label);
    setLog("");
    try {
      const res = await fetch(url, opts);
      const text = await res.text();
      setLog(text || `${res.status} ${res.statusText}`);
      if (res.ok) {
        showSuccess("Operación completada", `${label} ejecutado correctamente.`);
      } else {
        showError("Operación con error", `${label} devolvió estado ${res.status}.`);
      }
    } catch (e: any) {
      setLog(e?.message || "Error");
      showError("Error de ejecución", e?.message || "No se pudo completar la operación.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
        <CardBody className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-[#0d212c]">Herramientas operativas</h2>
          <p className="mt-1 text-sm text-default-500">
            Ejecuta procesos internos con retroalimentación inmediata de respuesta API.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border border-default-200 bg-default-50/40">
            <CardBody className="gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-default-700">Comunicaciones</p>
                <Chip size="sm" color="success" variant="flat">Riesgo bajo</Chip>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onPress={() =>
                    run("daily-digests", "/api/digest/daily", {
                      headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_DIGEST_TOKEN || ""}`,
                      },
                    })
                  }
                  isLoading={loading === "daily-digests"}
                  variant="flat"
                >
                  Ejecutar Daily Digest
                </Button>
                <Button
                  onPress={() =>
                    run("weekly-digests", "/api/digest/weekly", {
                      headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_DIGEST_TOKEN || ""}`,
                      },
                    })
                  }
                  isLoading={loading === "weekly-digests"}
                  variant="flat"
                >
                  Ejecutar Weekly Digest
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card className="border border-default-200 bg-default-50/40">
            <CardBody className="gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-default-700">Procesamiento</p>
                <Chip size="sm" color="warning" variant="flat">Riesgo medio</Chip>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onPress={() => {
                    setPendingAction({
                      label: "process-queue",
                      url: "/api/admin/process-queue",
                      opts: {
                        method: "POST",
                        headers: { "x-vercel-cron": "1" },
                      },
                      title: "Procesar cola ahora",
                      description:
                        "Se ejecutará el procesamiento inmediato de trabajos pendientes en cola.",
                      confirmLabel: "Ejecutar procesamiento",
                      riskLevel: "medium",
                    });
                  }}
                  isLoading={loading === "process-queue"}
                  color="primary"
                  variant="flat"
                >
                  Procesar Colas
                </Button>
                <Button
                  onPress={() => {
                    setPendingAction({
                      label: "daily-runner",
                      url: "/api/admin/daily-runner",
                      opts: {
                        headers: { "x-vercel-cron": "1" },
                      },
                      title: "Ejecutar daily runner",
                      description:
                        "Lanzará la secuencia diaria completa de tareas administrativas.",
                      confirmLabel: "Ejecutar runner",
                      riskLevel: "high",
                    });
                  }}
                  isLoading={loading === "daily-runner"}
                  variant="flat"
                >
                  Daily Runner (Secuencia)
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {loading && <Spinner label={`Ejecutando ${loading}...`} />}
        <div className="rounded-xl border border-default-200 bg-default-50/60 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-default-500">
            Resultado
          </p>
          <Code className="whitespace-pre-wrap w-full text-xs">
            {log || "Salida aparecerá aquí..."}
          </Code>
        </div>
        </CardBody>
      </Card>
      {pendingAction && (
        <ConfirmActionModal
          isOpen={Boolean(pendingAction)}
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          riskLevel={pendingAction.riskLevel}
          isLoading={loading === pendingAction.label}
          onClose={() => setPendingAction(null)}
          onConfirm={async () => {
            const action = pendingAction;
            setPendingAction(null);
            await run(action.label, action.url, action.opts);
          }}
        />
      )}
    </>
  );
}


