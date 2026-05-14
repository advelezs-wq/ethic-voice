"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Spinner, Tooltip } from "@heroui/react";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { ConfirmActionModal } from "./ConfirmActionModal";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  plan: string | null;
  status: string | null;
  subscriptionId: number | null;
  members: number;
  reports: number;
};

type SubscriptionActionType = "pause" | "resume" | "cancel";

interface PendingSubscriptionAction {
  type: SubscriptionActionType;
  subscriptionId: number;
  orgName: string;
}

export default function SuperAdminClientsTable() {
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingSubscriptionAction | null>(null);
  const [scope, setScope] = useState<"all" | "org">("all");
  const [selectedOrganizationName, setSelectedOrganizationName] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/clients", { cache: "no-store" });
    const data = await res.json();
    setRows(data.organizations || []);
    setScope(data.scope === "org" ? "org" : "all");
    setSelectedOrganizationName(data.selectedOrganizationName || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const runSubscriptionAction = async (action: PendingSubscriptionAction) => {
    try {
      setActionLoading(action.subscriptionId);
      const endpoint =
        action.type === "pause"
          ? "/api/superadmin/subscriptions/pause"
          : action.type === "resume"
            ? "/api/superadmin/subscriptions/resume"
            : "/api/superadmin/subscriptions/cancel";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: action.subscriptionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("No se pudo ejecutar la acción", data.error || "Intenta nuevamente.");
        return;
      }
      if (action.type === "pause") {
        showSuccess("Suscripción pausada", "La operación se aplicó correctamente.");
      } else if (action.type === "resume") {
        showSuccess("Suscripción reanudada", "La operación se aplicó correctamente.");
      } else {
        showSuccess(
          "Suscripción cancelada",
          "Se canceló al final del periodo de facturación."
        );
      }
      await load();
    } finally {
      setPendingAction(null);
      setActionLoading(null);
    }
  };

  const getRiskLevel = (row: OrgRow) => {
    if (!row.subscriptionId || row.status === "PAUSED" || row.status === "CANCELED") {
      return { label: "Alto", color: "danger" as const };
    }
    if (row.reports > 120 || row.members > 50) {
      return { label: "Medio", color: "warning" as const };
    }
    return { label: "Bajo", color: "success" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner label="Cargando clientes..." />
      </div>
    );
  }

  return (
    <>
      <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
        <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0d212c]">Clientes</h2>
            <p className="text-sm text-default-500">
              {scope === "all"
                ? "Vista general de clientes: estado comercial y acciones globales."
                : `Vista filtrada por organización${selectedOrganizationName ? `: ${selectedOrganizationName}` : ""}.`}
            </p>
            <div className="mt-2">
              <Chip
                size="sm"
                variant="flat"
                color={scope === "all" ? "success" : "primary"}
              >
                {scope === "all"
                  ? "Contexto: todas las organizaciones"
                  : `Contexto: ${selectedOrganizationName || "organización seleccionada"}`}
              </Chip>
            </div>
          </div>
          <Button variant="light" onPress={load} startContent={<i className="icon-[lucide--refresh-ccw] size-4" />}>Refrescar</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-default-500">
                <th className="py-2 pr-4">Organización</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Riesgo</th>
                <th className="py-2 pr-4">Miembros</th>
                <th className="py-2 pr-4">Casos</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-default-100">
                  <td className="py-2 pr-4">
                    <a href={`/app/organizations/${r.id}`} className="font-medium text-[#0d212c] hover:underline">{r.name}</a>
                    <div className="text-xs text-default-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="py-2 pr-4">{r.plan || "-"}</td>
                  <td className="py-2 pr-4">
                    {r.status ? (
                      <Chip size="sm" color={r.status === "ACTIVE" ? "success" : r.status === "PAUSED" ? "warning" : "default"}>{r.status}</Chip>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <Chip size="sm" color={getRiskLevel(r).color} variant="flat">
                      {getRiskLevel(r).label}
                    </Chip>
                  </td>
                  <td className="py-2 pr-4">{r.members}</td>
                  <td className="py-2 pr-4">{r.reports}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <Tooltip content="Pausar suscripción">
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() =>
                            r.subscriptionId &&
                            setPendingAction({
                              type: "pause",
                              subscriptionId: r.subscriptionId,
                              orgName: r.name,
                            })
                          }
                          isDisabled={!r.subscriptionId || r.status === "PAUSED"}
                          isLoading={actionLoading === r.subscriptionId}
                          startContent={<i className="icon-[lucide--pause] size-4" />}
                        >
                          Pausar
                        </Button>
                      </Tooltip>
                      <Tooltip content="Reanudar suscripción">
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() =>
                            r.subscriptionId &&
                            setPendingAction({
                              type: "resume",
                              subscriptionId: r.subscriptionId,
                              orgName: r.name,
                            })
                          }
                          isDisabled={!r.subscriptionId || r.status === "ACTIVE"}
                          isLoading={actionLoading === r.subscriptionId}
                          startContent={<i className="icon-[lucide--play] size-4" />}
                        >
                          Reanudar
                        </Button>
                      </Tooltip>
                      <Tooltip content="Cancelar al fin del periodo">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() =>
                            r.subscriptionId &&
                            setPendingAction({
                              type: "cancel",
                              subscriptionId: r.subscriptionId,
                              orgName: r.name,
                            })
                          }
                          isDisabled={!r.subscriptionId || r.status === "CANCELED"}
                          isLoading={actionLoading === r.subscriptionId}
                          startContent={<i className="icon-[lucide--x-circle] size-4" />}
                        >
                          Cancelar
                        </Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr className="border-t border-default-100">
                  <td className="py-6 pr-4 text-sm text-default-500" colSpan={7}>
                    No hay organizaciones para el contexto seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardBody>
      </Card>
      {pendingAction && (
        <ConfirmActionModal
          isOpen={Boolean(pendingAction)}
          title={
            pendingAction.type === "pause"
              ? "Pausar suscripción"
              : pendingAction.type === "resume"
                ? "Reanudar suscripción"
                : "Cancelar suscripción"
          }
          description={
            pendingAction.type === "cancel"
              ? `Vas a cancelar la suscripción de ${pendingAction.orgName} al final del periodo vigente.`
              : pendingAction.type === "pause"
                ? `Vas a pausar la suscripción activa de ${pendingAction.orgName}.`
                : `Vas a reactivar la suscripción de ${pendingAction.orgName}.`
          }
          confirmLabel={
            pendingAction.type === "pause"
              ? "Confirmar pausa"
              : pendingAction.type === "resume"
                ? "Confirmar reanudación"
                : "Confirmar cancelación"
          }
          riskLevel={pendingAction.type === "cancel" ? "high" : "medium"}
          isLoading={actionLoading === pendingAction.subscriptionId}
          onClose={() => setPendingAction(null)}
          onConfirm={() => runSubscriptionAction(pendingAction)}
        />
      )}
    </>
  );
}


