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
import { SuperAdminPanelShell } from "./SuperAdminPanelShell";

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
      <SuperAdminPanelShell
        title="Panel de Super Administrador"
        subtitle="Gestión global de organizaciones, clientes y operaciones críticas."
      >
        <div className="flex items-center justify-center rounded-2xl border border-default-200 bg-white/80 py-16">
          <Spinner size="lg" color="primary" />
        </div>
      </SuperAdminPanelShell>
    );
  }

  if (error) {
    return (
      <SuperAdminPanelShell
        title="Panel de Super Administrador"
        subtitle="Gestión global de organizaciones, clientes y operaciones críticas."
      >
        <Card className="border border-danger-200 bg-danger-50/80">
          <CardBody className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-danger">{error}</p>
            <Button onPress={loadData} color="danger" variant="flat">
              Reintentar
            </Button>
          </CardBody>
        </Card>
      </SuperAdminPanelShell>
    );
  }

  return (
    <SuperAdminPanelShell
      title="Panel de Super Administrador"
      subtitle="Visión unificada de operación, crecimiento y contenido en EthicVoice."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <Chip variant="flat" size="sm" color="success">
              Última actualización: {format(new Date(), "d MMM yyyy HH:mm", { locale: es })}
            </Chip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              href="/app/organizations"
              color="primary"
              className="bg-lime-400 font-semibold text-[#052b24] hover:bg-lime-500"
              startContent={<i className="icon-[tabler--building-plus] size-4" />}
            >
              Gestionar Organizaciones
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
            <CardBody className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <i className="icon-[lucide--users] size-5 text-emerald-700" />
                <p className="text-sm font-semibold text-default-700">Clientes</p>
              </div>
              <p className="text-xs text-default-500">
                Alta manual, estado de suscripción y control operativo.
              </p>
              <Button as={Link} href="/app/superadmin/clients" size="sm" variant="flat">
                Abrir clientes
              </Button>
            </CardBody>
          </Card>
          <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
            <CardBody className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <i className="icon-[lucide--wrench] size-5 text-emerald-700" />
                <p className="text-sm font-semibold text-default-700">Herramientas</p>
              </div>
              <p className="text-xs text-default-500">
                Digests, ejecución de colas y runner diario.
              </p>
              <Button as={Link} href="/app/superadmin/tools" size="sm" variant="flat">
                Abrir herramientas
              </Button>
            </CardBody>
          </Card>
          <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
            <CardBody className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <i className="icon-[lucide--book-user] size-5 text-emerald-700" />
                <p className="text-sm font-semibold text-default-700">Leads ebook</p>
              </div>
              <p className="text-xs text-default-500">
                Seguimiento de adquisición y campañas públicas.
              </p>
              <Button as={Link} href="/app/superadmin/leads" size="sm" variant="flat">
                Ver leads
              </Button>
            </CardBody>
          </Card>
          <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
            <CardBody className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <i className="icon-[lucide--newspaper] size-5 text-emerald-700" />
                <p className="text-sm font-semibold text-default-700">Blog público</p>
              </div>
              <p className="text-xs text-default-500">
                Publicación de contenido y revisión del sitio.
              </p>
              <div className="flex gap-2">
                <Button as={Link} href="/app/superadmin/blog" size="sm" variant="flat">
                  Administrar
                </Button>
                <Button
                  as={Link}
                  href="/blog"
                  size="sm"
                  variant="light"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver blog
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {systemStats && <SystemStats stats={systemStats} />}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0d212c]">
              Organizaciones ({organizations.length})
            </h2>
            <Button variant="light" size="sm" onPress={loadData}>
              Refrescar datos
            </Button>
          </div>
          {organizations.length === 0 ? (
            <Card className="border border-default-200 bg-white/90">
              <CardBody className="text-center py-10">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <OrganizationCard key={org.id} organization={org} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SuperAdminPanelShell>
  );
}
