"use client";

import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { Button, User } from "@heroui/react";
import { useUserStore } from "@/modules/store/user-store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SidebarItem } from "./SidebarItem";
import { useSidebar } from "../../context/SidebarContext";
import { useUserRole } from "@/modules/core/hooks/useUserRole";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const isLoading = useUserStore((state) => state.isLoading);
  const { isCollapsed } = useSidebar();
  const { user } = useUser();
  const { permissions, isSuperAdmin } = useUserRole();

  const isActive = (path: string) => {
    if (path === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(path);
  };

  // Base navigation items
  const baseItems = [
    {
      icon: (
        <i
          className="icon-[material-symbols--dashboard] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      text: "Dashboard",
      to: "/app",
    },
    {
      icon: (
        <i
          className="icon-[ic--baseline-report] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      text: permissions.canViewAllReports ? "Denuncias" : "Mis Casos",
      to: "/app/reports",
    },
  ];

  // Organization admin items
  const adminItems =
    permissions.canManageOrganization && !isSuperAdmin
      ? [
          {
            icon: (
              <i
                className="icon-[fluent--organization-24-filled] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Organización",
            to: "/app/organization",
          },

          {
            icon: (
              <i
                className="icon-[lucide--mail] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Correo",
            to: "/app/email",
          },
          /*
          {
            icon: (
              <i
                className="icon-[ant-design--form-outlined] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Formularios",
            to: "/app/your-forms",
          },
          */
          {
            icon: (
              <i
                className="icon-[lucide--users] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Equipo",
            to: "/app/team",
          },
          {
            icon: (
              <i
                className="icon-[lucide--bar-chart-3] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Analíticas e Informes",
            to: "/app/analytics",
          },
          {
            icon: (
              <i
                className="icon-[lucide--wallet] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Plan y facturación",
            to: "/app/billing",
          },
          {
            icon: (
              <i
                className="icon-[lucide--settings] size-5"
                role="img"
                aria-hidden="true"
              />
            ),
            text: "Configuración del Sistema",
            to: "/app/settings",
          },
        ]
      : [];

  // Member items (limited access)
  const memberItems = !permissions.canManageOrganization
    ? [
        {
          icon: (
            <i
              className="icon-[fluent--organization-24-filled] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Mi Organización",
          to: "/app/organization",
        },
      ]
    : [];

  // Super admin items
  const superAdminItems = isSuperAdmin
    ? [
        {
          icon: (
            <i
              className="icon-[lucide--building-2] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Todas las Organizaciones",
          to: "/app/organizations",
        },
        {
          icon: (
            <i
              className="icon-[lucide--users] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Clientes",
          to: "/app/superadmin/clients",
        },
        {
          icon: (
            <i
              className="icon-[lucide--terminal] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Herramientas",
          to: "/app/superadmin/tools",
        },
        {
          icon: (
            <i
              className="icon-[lucide--newspaper] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Blog",
          to: "/app/superadmin/blog",
        },
        {
          icon: (
            <i
              className="icon-[lucide--file-text] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Leads ebook",
          to: "/app/superadmin/leads",
        },
        {
          icon: (
            <i
              className="icon-[lucide--user-plus] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Crear Clientes",
          to: "/app/superadmin/clients",
        },
        {
          icon: (
            <i
              className="icon-[lucide--shield-check] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Seguridad",
          to: "/app/security",
        },
      ]
    : [];

  // Profile item (always visible)
  const profileItem = {
    icon: (
      <i
        className="icon-[heroicons-solid--user] size-5"
        role="img"
        aria-hidden="true"
      />
    ),
    text: "Perfil",
    to: "/app/profile",
  };

  const navigationItems = [
    ...baseItems,
    ...adminItems,
    ...memberItems,
    ...superAdminItems,
    profileItem,
  ];

  return (
    <aside
      className={`
      ${isCollapsed ? "w-20" : "w-[270px] 2xl:w-[283px]"} 
      h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative z-10
    `}
    >
      {/* Header */}
      <div
        className={`h-[89px] flex items-center border-b border-gray-200 ${
          isCollapsed ? "justify-center" : "justify-start p-6"
        }`}
      >
        <Link
          href="/app"
          className={`flex items-center min-w-0 ${
            isCollapsed ? "justify-center w-full" : "justify-start gap-2"
          }`}
          aria-label="EthicVoice — inicio"
        >
          <Image
            src="/brand/logo-nobg.png"
            alt="EthicVoice"
            width={170}
            height={40}
            className={`object-contain ${
              isCollapsed ? "h-8 w-8" : "h-10 w-auto max-w-[10.5rem]"
            }`}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="mb-8">
          <p
            className={`text-xs font-semibold text-gray-500 uppercase mb-3 px-3 transition-all duration-300 ${
              isCollapsed ? "opacity-0 h-0" : "opacity-100 h-auto"
            }`}
          >
            Navegación
          </p>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                text={item.text}
                to={item.to}
                isActive={isActive(item.to)}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Info & Logout */}
      <div
        className={` border-t border-gray-200 p-4 ${
          isCollapsed ? "" : "mt-auto"
        }`}
      >
        <SignedIn>
          <div
            className={`mb-3 transition-all duration-300 ${
              isCollapsed ? "hidden" : "opacity-100"
            }`}
          >
            <User
              name={user?.fullName}
              description={user?.emailAddresses[0].emailAddress}
              avatarProps={{
                src: user?.imageUrl,
                size: "sm",
                icon: (
                  <i
                    className="icon-[heroicons-solid--user] size-4"
                    role="img"
                    aria-hidden="true"
                  />
                ),
              }}
            />
          </div>

          <SignOutButton redirectUrl={`/auth/sign-in`}>
            <Button
              variant="light"
              className={`w-full text-gray-600 hover:text-gray-900 transition-all duration-300 px-0 min-w-0 ${
                isCollapsed ? "justify-center" : "justify-start"
              }`}
              isLoading={isLoading}
              startContent={
                !isLoading && (
                  <i
                    className="icon-[lucide--log-out] size-5"
                    role="img"
                    aria-hidden="true"
                  />
                )
              }
            >
              <span
                className={`transition-all duration-300 ${
                  isCollapsed ? "hidden" : "w-auto opacity-100"
                } overflow-hidden whitespace-nowrap`}
              >
                Cerrar Sesión
              </span>
            </Button>
          </SignOutButton>
        </SignedIn>
      </div>
    </aside>
  );
};
