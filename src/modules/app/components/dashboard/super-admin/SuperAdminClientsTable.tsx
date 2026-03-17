"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Spinner, Tooltip } from "@heroui/react";

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

export default function SuperAdminClientsTable() {
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/clients", { cache: "no-store" });
    const data = await res.json();
    setRows(data.organizations || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const pause = async (id: number | null) => {
    if (!id) return;
    await fetch("/api/superadmin/subscriptions/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: id }),
    });
    load();
  };
  const resume = async (id: number | null) => {
    if (!id) return;
    await fetch("/api/superadmin/subscriptions/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: id }),
    });
    load();
  };
  const cancelSub = async (id: number | null) => {
    if (!id) return;
    await fetch("/api/superadmin/subscriptions/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: id }),
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner label="Cargando clientes..." />
      </div>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Clientes</h2>
          <Button variant="light" onPress={load} startContent={<i className="icon-[lucide--refresh-ccw] size-4" />}>Refrescar</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Organización</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Miembros</th>
                <th className="py-2 pr-4">Casos</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4">
                    <a href={`/app`} className="font-medium text-gray-900 hover:underline">{r.name}</a>
                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="py-2 pr-4">{r.plan || "-"}</td>
                  <td className="py-2 pr-4">
                    {r.status ? (
                      <Chip size="sm" color={r.status === "ACTIVE" ? "success" : r.status === "PAUSED" ? "warning" : "default"}>{r.status}</Chip>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 pr-4">{r.members}</td>
                  <td className="py-2 pr-4">{r.reports}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Tooltip content="Pausar suscripción">
                        <Button size="sm" variant="light" onPress={() => pause(r.subscriptionId)} isDisabled={!r.subscriptionId || r.status === "PAUSED"}>
                          <i className="icon-[lucide--pause] size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Reanudar suscripción">
                        <Button size="sm" variant="light" onPress={() => resume(r.subscriptionId)} isDisabled={!r.subscriptionId || r.status === "ACTIVE"}>
                          <i className="icon-[lucide--play] size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Cancelar al fin del periodo">
                        <Button size="sm" color="danger" variant="flat" onPress={() => cancelSub(r.subscriptionId)} isDisabled={!r.subscriptionId || r.status === "CANCELED"}>
                          <i className="icon-[lucide--x-circle] size-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}


