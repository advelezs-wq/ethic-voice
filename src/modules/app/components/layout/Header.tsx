"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/modules/brand/components/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { Button as AppButton } from "@/modules/app/components/ui";

// Nombre de la sección actual (el título grande de cada página vive en su PageHero).
const SECTIONS: Array<[string, string]> = [
  ["/app/reports", "Denuncias"],
  ["/app/organizations", "Organizaciones"],
  ["/app/organization", "Organización"],
  ["/app/email", "Correo"],
  ["/app/team", "Equipo"],
  ["/app/analytics", "Analíticas e informes"],
  ["/app/billing", "Plan y facturación"],
  ["/app/settings", "Configuración"],
  ["/app/profile", "Perfil"],
  ["/app/security", "Seguridad"],
  ["/app/your-forms", "Formularios"],
  ["/app/superadmin/clients", "Clientes"],
  ["/app/superadmin/tools", "Herramientas"],
  ["/app/superadmin/blog", "Blog"],
  ["/app/superadmin/leads", "Leads"],
  ["/app/superadmin/lead-magnets", "Recursos descargables"],
  ["/app/onboarding", "Configuración inicial"],
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const section = SECTIONS.find(([prefix]) => pathname?.startsWith(prefix))?.[1];
  const { toggleSidebar } = useSidebar();
  const { permissions, isSuperAdmin, isLoading: roleLoading } = useUserRole();
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
          size="sm"
          aria-label="Contraer o expandir la navegación"
          className="hidden text-ev-mute lg:flex"
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
          {/* Shared home/brand link for every org and superadmins — always
              EthicVoice's own mark, never the org-in-context's uploaded logo. */}
          <Logo markClassName="h-7 w-auto" />
        </Link>

        <div className="hidden lg:block">
          <p className="ev-label text-ev-mute">
            {isSuperAdmin && superAdminScope === "all"
              ? "EthicVoice · Global"
              : currentOrganization?.name || "EthicVoice"}
          </p>
          <p className="mt-0.5 text-[1.0625rem] font-semibold tracking-[-0.02em] text-ev-night">
            {section ??
              (roleLoading ? "\u00a0" : null) ??
              (isSuperAdmin
                ? superAdminScope === "org"
                  ? "Vista de organización"
                  : "Panel de super administrador"
                : permissions.canViewAllReports
                  ? "Inicio"
                  : "Mi espacio de trabajo")}
          </p>
        </div>
      </div>

      {/* Actions and Navigation */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end min-w-0">
        {!isSuperAdmin && !roleLoading && (
          <span className="ev-label hidden items-center gap-2 text-ev-mute xl:inline-flex">
            <span className="h-1.5 w-1.5 bg-ev-signal" aria-hidden />
            {permissions.canManageOrganization ? "Administrador" : "Investigador"}
          </span>
        )}
        {/* Create Report Button - Only for Admins */}
        {permissions.canManageOrganization && currentOrganization && (
          <AppButton
            appVariant="primary"
            onPress={onOpen}
            startContent={
              <i
                className="icon-[ic--baseline-add-circle] size-4"
                role="img"
                aria-hidden="true"
              />
            }
          >
            <span className="hidden sm:inline">Registrar denuncia</span>
          </AppButton>
        )}

        {isSuperAdmin && organizations?.length > 0 && (
          <div className="flex items-center gap-2">
            {superAdminScope === "org" && (
              <Button
                variant="flat"
                className="border border-ev-line bg-white text-ev-night"
                onPress={goBackToSuperAdminPanel}
                startContent={<i className="icon-[lucide--arrow-left] size-4" />}
              >
                <span className="hidden sm:inline">Volver a Super Admin</span>
              </Button>
            )}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="min-w-0 max-w-[280px] justify-start border border-ev-line bg-white sm:min-w-[230px]"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        superAdminScope === "all"
                          ? "bg-lime-300 text-ev-night"
                          : "bg-emerald-200 text-emerald-900"
                      }`}
                    >
                      {superAdminScope === "all" ? "Global" : "Por org"}
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-[160px] text-sm font-medium text-ev-night">
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
                  ? "Ver denuncias de todas las organizaciones"
                  : `Ver reportes de ${currentOrganization?.name || "la organización seleccionada"}`
              }
            >
              <Button
                as={Link}
                href="/app/reports"
                variant="flat"
                className="border border-ev-line bg-white text-ev-night"
                startContent={
                  <i className="icon-[lucide--file-text] size-4" aria-hidden="true" />
                }
              >
                <span className="hidden sm:inline">Ir a denuncias</span>
              </Button>
            </Tooltip>
          </div>
        )}
        {isSuperAdmin && (!organizations || organizations.length === 0) && (
          <span className="text-sm text-slate-400 truncate">
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
