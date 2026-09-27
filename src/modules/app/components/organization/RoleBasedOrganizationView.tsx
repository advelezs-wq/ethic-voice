"use client";

import React, { useState, useEffect } from "react";
// Removed Clerk organization components
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { DepartmentList } from "../departments/DepartmentList";
import { getDepartmentsWithStats } from "@/actions/department.actions";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { DepartmentWithStats } from "@/types/department.types";
import { Alert } from "@heroui/alert";
import { CustomOrganizationManagement } from "./CustomOrganizationManagement";
import { BillingManager } from "../subscription/BillingManager";

export function RoleBasedOrganizationView() {
  const { permissions, isSuperAdmin } = useUserRole();
  const { currentOrganization } = useOrganization();
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartments = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await getDepartmentsWithStats(currentOrganization.id);
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization && permissions.canManageOrganization) {
      loadDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization, permissions.canManageOrganization]);

  // Los super administradores deben ver la misma pantalla y pestañas que un admin de organización

  return (
    <section className="h-full w-full space-y-6">
      <div className="ev-page-hero">
        <p className="ev-page-hero-kicker">
          {isSuperAdmin ? "Vista de organización" : "Organización"}
        </p>
        <h1 className="ev-page-hero-title">
          {isSuperAdmin ? "Organización" : "Mi organización"}
        </h1>
        <p className="ev-page-hero-description">
          {permissions.canManageOrganization
            ? "Gestiona la configuración, miembros y departamentos de la organización."
            : "Información de tu organización."}
        </p>
      </div>

      {permissions.canManageOrganization ? (
        <div className="overflow-x-auto pb-1 -mb-px rounded-2xl border border-ev-line bg-white p-3 sm:p-4">
          <Tabs aria-label="Opciones de organización" className="min-w-max">
            <Tab key="profile" title="Equipo y datos">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div className="col-span-2">
                  <CustomOrganizationManagement />
                </div>
                <div className="space-y-4 col-span-1">
                  <Card className="border border-ev-line shadow-none">
                    <CardBody className="p-6">
                      <h3 className="text-base font-semibold text-ev-night">
                        Roles del equipo
                      </h3>
                      <p className="mt-1 text-sm text-ev-mute">
                        Usa “Invitar miembro” y elige el rol según lo que la persona deba hacer.
                      </p>
                      <dl className="mt-4 space-y-3 text-sm">
                        <div>
                          <dt className="font-medium text-ev-night">Administrador</dt>
                          <dd className="text-ev-mute">
                            Ve todas las denuncias, asigna responsables y configura la organización.
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-ev-night">Investigador</dt>
                          <dd className="text-ev-mute">
                            Trabaja solo en las denuncias que se le asignan.
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-ev-night">Observador</dt>
                          <dd className="text-ev-mute">
                            Consulta todo (por ejemplo, auditoría o comité) sin poder modificar nada.
                          </dd>
                        </div>
                      </dl>
                    </CardBody>
                  </Card>

                  {departments.length === 0 && !loading && (
                    <Alert
                      color="warning"
                      description={
                        "Recomendación: crea los departamentos antes de invitar miembros; así cada denuncia llega al área correcta."
                      }
                    />
                  )}
                </div>
              </div>
            </Tab>

            <Tab key="departments" title="Departamentos">
              <div className="mt-4 sm:mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" color="primary" />
                  </div>
                ) : (
                  <DepartmentList
                    departments={departments}
                    onRefresh={loadDepartments}
                  />
                )}
              </div>
            </Tab>

            <Tab key="billing" title="Plan y facturación">
              <div className="mt-4 sm:mt-6">
                <BillingManager />
              </div>
            </Tab>
          </Tabs>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="col-span-2">
            <CustomOrganizationManagement />
          </div>
          <div className="space-y-4 col-span-1">
            <Card className="border border-ev-line shadow-none">
              <CardBody className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  Información
                </h3>
                <p className="text-sm text-slate-500">
                  Contacta a un administrador si necesitas cambios en la
                  configuración de la organización o acceso a otras funciones.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
