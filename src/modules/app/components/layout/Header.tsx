"use client";

import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import {
  Button,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { useSidebar } from "../../context/SidebarContext";
import { useUserRole } from "@/modules/core/hooks/useUserRole";
import { NotificationBell } from "../notifications/NotificationBell";
import { CreateReportModal } from "../reports/CreateReportModal";

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { permissions, isSuperAdmin } = useUserRole();
  const { currentOrganization, organizations, switchOrganization } =
    useOrganization();
  const { isLoaded: _userLoaded } = useUser();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200">
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

        {/* Neutral label on sm/md, no logos for internal demo */}
        <div className="lg:hidden pl-10 md:pl-16">
          <span className="text-sm font-semibold text-gray-700">
            Plataforma
          </span>
        </div>

        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-gray-900">
            {isSuperAdmin
              ? "Panel de Super Administrador"
              : permissions.canViewAllReports
                ? "Panel de Control"
                : "Mi Espacio de Trabajo"}
          </h1>
          <p className="text-sm text-gray-500">
            {isSuperAdmin
              ? "Gestión global del sistema"
              : permissions.canViewAllReports
                ? "Gestión de denuncias y reportes"
                : "Gestión de casos asignados"}
          </p>
        </div>
        <div className="hidden"></div>
      </div>

      {/* Actions and Navigation */}
      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end min-w-0">
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
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="light"
                className="min-w-[140px] sm:min-w-[180px] max-w-[220px] justify-start"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                    {currentOrganization?.name?.charAt(0).toUpperCase() || "O"}
                  </span>
                  <span className="truncate max-w-[90px] sm:max-w-[120px]">
                    {currentOrganization?.name || "Seleccionar organización"}
                  </span>
                  <i className="icon-[lucide--chevrons-up-down] size-4 opacity-70" />
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Organizaciones disponibles"
              selectionMode="single"
              selectedKeys={new Set([currentOrganization?.id || ""])}
              onAction={(key) => {
                const orgId = String(key);
                switchOrganization(orgId);
                try {
                  document.cookie = `ev_org=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}`;
                } catch {}
              }}
            >
              {organizations.map((org) => (
                <DropdownItem
                  key={org.id}
                  startContent={
                    <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                      {org.name?.charAt(0).toUpperCase() || "O"}
                    </span>
                  }
                >
                  {org.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
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
