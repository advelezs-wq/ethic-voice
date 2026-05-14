"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import {
  Button,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from "@heroui/react";
import { useSidebar } from "../../context/SidebarContext";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { NotificationBell } from "../notifications/NotificationBell";
import { CreateReportModal } from "../reports/CreateReportModal";

export function Header() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { permissions, isSuperAdmin } = useUserRole();
  const { currentOrganization, organizations, switchOrganization, setCurrentOrganization } =
    useOrganization();
  const { isLoaded: _userLoaded } = useUser();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [superAdminScope, setSuperAdminScope] = useState<"all" | "org">("org");
  const organizationOptions = (organizations || []).map((org) => ({
    id: org.id,
    name: org.name || "Organización",
    initial: org.name?.charAt(0).toUpperCase() || "O",
  }));

  useEffect(() => {
    if (!isSuperAdmin) return;
    const readScope = () => {
      const scopeCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("ev_scope="))
        ?.split("=")[1];
      if (scopeCookie === "org") {
        setSuperAdminScope("org");
      } else {
        setSuperAdminScope("all");
        try {
          document.cookie = `ev_scope=all; path=/; max-age=${60 * 60 * 24 * 30}`;
        } catch {}
      }
    };
    readScope();
    window.addEventListener("ev-scope-changed", readScope as EventListener);
    return () => {
      window.removeEventListener("ev-scope-changed", readScope as EventListener);
    };
  }, [isSuperAdmin]);

  const goBackToSuperAdminPanel = () => {
    try {
      document.cookie = `ev_scope=all; path=/; max-age=${60 * 60 * 24 * 30}`;
      window.dispatchEvent(new Event("ev-scope-changed"));
    } catch {}
    router.push("/app");
  };

  return (
    <header className="ev-header-surface flex items-center justify-between h-16 px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sidebar toggle button */}
        <Button
          isIconOnly
          variant="light"
          className="hidden lg:flex"
          onPress={toggleSidebar}
        >
          <i
            className="icon-[meteor-icons--sidebar] size-5"
            role="img"
            aria-hidden="true"
          />
        </Button>

        <Link
          href="/app"
          className="lg:hidden inline-flex items-center pl-10 md:pl-16"
          aria-label="EthicVoice — inicio"
        >
          <Image
            src="/brand/logo-nobg.png"
            alt="EthicVoice"
            width={160}
            height={38}
            className="h-8 w-auto max-w-[9.5rem] object-contain"
            priority
          />
        </Link>

        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-gray-900">
            {isSuperAdmin
              ? superAdminScope === "org"
                ? "Workspace de Organización"
                : "Panel de Super Administrador"
              : permissions.canViewAllReports
                ? "Panel de Control"
                : "Mi Espacio de Trabajo"}
          </h1>
          <p className="text-sm text-gray-500">
            {isSuperAdmin
              ? superAdminScope === "org"
                ? "Operando dentro de la organización seleccionada"
                : "Gestión global del sistema"
              : permissions.canViewAllReports
                ? "Gestión de denuncias y reportes"
                : "Gestión de casos asignados"}
          </p>
        </div>
      </div>

      {/* Actions and Navigation */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end min-w-0">
        {!isSuperAdmin && (
          <span className="hidden xl:inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            {permissions.canManageOrganization ? "Workspace Admin" : "Workspace Investigador"}
          </span>
        )}
        {/* Create Report Button - Only for Admins */}
        {permissions.canManageOrganization && currentOrganization && (
          <Button
            color="primary"
            variant="solid"
            onPress={onOpen}
            startContent={
              <i
                className="icon-[ic--baseline-add-circle] size-4"
                role="img"
                aria-hidden="true"
              />
            }
            className="font-medium"
          >
            Crear Reporte
          </Button>
        )}

        {isSuperAdmin && organizations?.length > 0 && (
          <div className="flex items-center gap-2">
            {superAdminScope === "org" && (
              <Button
                variant="flat"
                className="border border-emerald-200 bg-white text-[#0d212c]"
                onPress={goBackToSuperAdminPanel}
                startContent={<i className="icon-[lucide--arrow-left] size-4" />}
              >
                Volver a Super Admin
              </Button>
            )}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="min-w-[170px] sm:min-w-[230px] max-w-[280px] justify-start border border-emerald-200 bg-emerald-50/60"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        superAdminScope === "all"
                          ? "bg-lime-300 text-[#052b24]"
                          : "bg-emerald-200 text-emerald-900"
                      }`}
                    >
                      {superAdminScope === "all" ? "Global" : "Por org"}
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-[160px] text-sm font-medium text-[#0d212c]">
                      {superAdminScope === "all"
                        ? "Todas las organizaciones"
                        : currentOrganization?.name || "Seleccionar organización"}
                    </span>
                    <i className="icon-[lucide--chevrons-up-down] size-4 opacity-70 flex-shrink-0" />
                  </span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Ámbito de visualización"
                selectionMode="single"
                selectedKeys={new Set([superAdminScope === "all" ? "__all__" : currentOrganization?.id || ""])}
                items={[
                  { id: "__all__", name: "Vista general (todas)", isGlobal: true },
                  ...organizationOptions.map((opt) => ({
                    id: opt.id,
                    name: opt.name,
                    isGlobal: false,
                    initial: opt.initial,
                  })),
                ]}
                onAction={(key) => {
                  const value = String(key);
                  try {
                    if (value === "__all__") {
                      setSuperAdminScope("all");
                      setCurrentOrganization(null);
                      document.cookie = `ev_scope=all; path=/; max-age=${60 * 60 * 24 * 30}`;
                      window.dispatchEvent(new Event("ev-scope-changed"));
                      router.push("/app");
                      return;
                    }

                    setSuperAdminScope("org");
                    switchOrganization(value);
                    document.cookie = `ev_org=${value}; path=/; max-age=${60 * 60 * 24 * 30}`;
                    document.cookie = `ev_scope=org; path=/; max-age=${60 * 60 * 24 * 30}`;
                    window.dispatchEvent(new Event("ev-scope-changed"));
                    router.push("/app/reports");
                  } catch {}
                }}
              >
                {(item) => (
                  <DropdownItem
                    key={String(item.id)}
                    description={
                      item.isGlobal
                        ? "Ve denuncias, métricas y datos de todas las organizaciones."
                        : "Limita vistas y acciones al contexto de esta organización."
                    }
                    startContent={
                      item.isGlobal ? (
                        <i className="icon-[lucide--globe-2] size-4 text-emerald-700" />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center">
                          {"initial" in item ? item.initial : "O"}
                        </span>
                      )
                    }
                  >
                    {item.name}
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
            <Tooltip
              content={
                superAdminScope === "all"
                  ? "Ver reportes globales"
                  : `Ver reportes de ${currentOrganization?.name || "la organización seleccionada"}`
              }
            >
              <Button
                as={Link}
                href="/app/reports"
                variant="flat"
                className="border border-emerald-200 bg-white text-[#0d212c]"
                startContent={
                  <i className="icon-[lucide--file-text] size-4" aria-hidden="true" />
                }
              >
                Ir a reportes
              </Button>
            </Tooltip>
          </div>
        )}
        {isSuperAdmin && (!organizations || organizations.length === 0) && (
          <span className="text-sm text-gray-500 truncate">
            Aún no hay organizaciones
          </span>
        )}
        <NotificationBell />
      </div>

      {/* Create Report Modal */}
      {currentOrganization && (
        <CreateReportModal
          isOpen={isOpen}
          onClose={onClose}
          organizationId={currentOrganization.id}
        />
      )}
    </header>
  );
}
