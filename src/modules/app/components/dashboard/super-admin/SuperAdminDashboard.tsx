"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { getAllOrganizationsStats } from "@/actions/superadmin.actions";
import { OrganizationCard } from "./OrganizationCard";
import { SystemStats } from "./SystemStats";
import { DownloadPDFButton } from "../../analytics/DownloadPDFButton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { generateDemoSuperAdminData } from "../../../services/demo-analytics.service";

// Demo mode flag - set to true to enable demo data
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || false;

export function SuperAdminDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizations, setOrganizations] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // If demo mode is enabled, use demo data
      if (DEMO_MODE) {
        const demoData = generateDemoSuperAdminData();
        setOrganizations(demoData.organizations);
        setSystemStats(demoData.systemStats);
      } else {
        const data = await getAllOrganizationsStats();
        setOrganizations(data.organizations);
        setSystemStats(data.systemStats);
      }
    } catch (error) {
      console.error("Error loading super admin data:", error);
      setError("Error al cargar los datos. Por favor, intente nuevamente.");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onPress={loadData} color="primary">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Super Administrador
            </h1>
            {DEMO_MODE && (
              <Chip
                color="warning"
                variant="flat"
                size="sm"
                startContent={<i className="icon-[lucide--test-tube] size-3" />}
              >
                Modo Demo
              </Chip>
            )}
          </div>
          <p className="text-gray-600">
            Gestión global de todas las organizaciones del sistema
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <DownloadPDFButton
            reportType="super_admin"
            data={{ organizations, systemStats }}
            filename={`reporte-global-${format(new Date(), "yyyy-MM-dd", {
              locale: es,
            })}`}
            buttonText="Descargar Reporte Global"
          />
          <Button
            as={Link}
            href="/app/superadmin/blog"
            variant="flat"
            startContent={<i className="icon-[lucide--newspaper] size-4" />}
          >
            Blog público
          </Button>
          <Button
            as={Link}
            href="/app/organizations"
            color="primary"
            startContent={<i className="icon-[tabler--building-plus] size-4" />}
          >
            Gestionar Organizaciones
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-semibold text-default-700">Blog</p>
              <p className="text-xs text-default-500">
                Crear, editar y publicar artículos en /blog
              </p>
            </div>
            <Button
              as={Link}
              href="/app/superadmin/blog"
              size="sm"
              color="primary"
              variant="flat"
            >
              Administrar
            </Button>
          </CardBody>
        </Card>
        <Card className="border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-semibold text-default-700">Clientes</p>
              <p className="text-xs text-default-500">Alta manual y tabla de clientes</p>
            </div>
            <Button
              as={Link}
              href="/app/superadmin/clients"
              size="sm"
              variant="flat"
            >
              Abrir
            </Button>
          </CardBody>
        </Card>
        <Card className="border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-semibold text-default-700">Herramientas</p>
              <p className="text-xs text-default-500">Digests, colas y tareas</p>
            </div>
            <Button
              as={Link}
              href="/app/superadmin/tools"
              size="sm"
              variant="flat"
            >
              Abrir
            </Button>
          </CardBody>
        </Card>
        <Card className="border border-default-200 shadow-sm">
          <CardBody className="flex flex-row items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-semibold text-default-700">Ver sitio</p>
              <p className="text-xs text-default-500">Blog y marketing públicos</p>
            </div>
            <Button
              as={Link}
              href="/blog"
              size="sm"
              variant="flat"
              target="_blank"
              rel="noopener noreferrer"
            >
              /blog
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* System Stats */}
      {systemStats && <SystemStats stats={systemStats} />}

      {/* Organizations Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Organizaciones ({organizations.length})
        </h2>
        {organizations.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-500">Aún no hay organizaciones creadas</p>
              <Button
                as={Link}
                href="/app/organizations"
                color="primary"
                className="mt-4"
              >
                Crear Primera Organización
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
