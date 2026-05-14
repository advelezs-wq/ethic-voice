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
import { SubscriptionManagement } from "../subscription/SubscriptionManagement";

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
          {isSuperAdmin ? "Workspace de organización" : "Gestión interna"}
        </p>
        <h1 className="ev-page-hero-title">
          {isSuperAdmin ? "Organización" : "Mi Organización"}
        </h1>
        <p className="ev-page-hero-description">
          {permissions.canManageOrganization
            ? "Gestiona la configuración, miembros y departamentos de la organización."
            : "Información de tu organización."}
        </p>
      </div>

      {permissions.canManageOrganization ? (
        <div className="overflow-x-auto pb-1 -mb-px rounded-2xl border border-emerald-100 bg-white p-3 sm:p-4">
          <Tabs aria-label="Opciones de organización" className="min-w-max">
            <Tab key="profile" title="Configuración y Miembros">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
                <div className="col-span-2">
                  <CustomOrganizationManagement />
                </div>
                <div className="space-y-4 col-span-1">
                  <Card className="border border-emerald-100 shadow-none">
                    <CardBody className="p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Invitar Miembros
                      </h3>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Para invitar nuevos miembros desde la plataforma:
                        </p>
                        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                          <li>
                            Haz clic en "Invitar Miembro" en la parte superior
                            derecha de esta sección
                          </li>
                          <li>
                            Ingresa el correo electrónico del nuevo miembro
                          </li>
                          <li>
                            Selecciona el rol: <strong>Administrador</strong> o{" "}
                            <strong>Investigador</strong>
                          </li>
                          <li>
                            Si es Investigador, será asignado por defecto al
                            departamento General (puedes moverlo luego)
                          </li>
                        </ol>
                      </div>
                    </CardBody>
                  </Card>

                  {departments.length === 0 && !loading && (
                    <Alert
                      color="warning"
                      description={
                        "Recomendación: Crea departamentos antes de invitar miembros para una mejor organización de los reportes."
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

            <Tab key="billing" title="Facturación">
              <div className="mt-4 sm:mt-6">
                <SubscriptionManagement />
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
            <Card className="border border-emerald-100 shadow-none">
              <CardBody className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  Información
                </h3>
                <p className="text-sm text-gray-600">
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
