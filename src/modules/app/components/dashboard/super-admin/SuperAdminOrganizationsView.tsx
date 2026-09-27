/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Spinner } from "@heroui/spinner";
import { getAllOrganizationsStats } from "@/actions/superadmin.actions";
import { SystemStats } from "./SystemStats";
import { OrganizationCard } from "./OrganizationCard";

export function SuperAdminOrganizationsView() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getAllOrganizationsStats();
      setOrganizations(data.organizations);
      setSystemStats(data.systemStats);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ev-night">
            Gestión de Organizaciones
          </h1>
          <p className="text-slate-500">
            Administra todas las organizaciones del sistema
          </p>
        </div>
        <Button
          color="primary"
          onPress={() => {
            // Los clientes se crean con su administrador y plan desde Clientes.
            window.location.href = "/app/superadmin/clients";
          }}
          startContent={<i className="icon-[tabler--building-plus] size-4" />}
        >
          Nuevo cliente
        </Button>
      </div>

      {/* System Stats */}
      {systemStats && <SystemStats stats={systemStats} />}

      {/* Organizations Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Organizaciones ({organizations.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      </div>

    </div>
  );
}
