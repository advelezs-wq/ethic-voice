"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs";
import { useUserStore } from "@/modules/store/user-store";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo, LogoMark } from "@/modules/brand/components/Logo";
import { SidebarItem } from "./SidebarItem";
import { useSidebar } from "../../context/SidebarContext";
import { useUserRole } from "@/modules/core/hooks/useUserRole";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoading = useUserStore((state) => state.isLoading);
  const { isCollapsed } = useSidebar();
  const { user } = useUser();
  const { permissions, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const [superAdminScope, setSuperAdminScope] = useState<"all" | "org">("all");

  useEffect(() => {
    if (!isSuperAdmin) return;
    const readScope = () => {
      const scopeCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("ev_scope="))
        ?.split("=")[1];
      setSuperAdminScope(scopeCookie === "org" ? "org" : "all");
    };
    readScope();
    window.addEventListener("ev-scope-changed", readScope as EventListener);
    return () => {
      window.removeEventListener("ev-scope-changed", readScope as EventListener);
    };
  }, [isSuperAdmin]);

  const isSuperAdminOrgWorkspace = isSuperAdmin && superAdminScope === "org";

  const returnToSuperAdminPanel = () => {
    try {
      document.cookie = `ev_scope=all; path=/; max-age=${60 * 60 * 24 * 30}`;
      window.dispatchEvent(new Event("ev-scope-changed"));
    } catch {}
    router.push("/app");
  };

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
      text: "Inicio",
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
    permissions.canManageOrganization && (!isSuperAdmin || isSuperAdminOrgWorkspace)
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
            text: "Analíticas e informes",
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
            text: "Configuración",
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
          text: "Mi organización",
          to: "/app/organization",
        },
      ]
    : [];

  // Super admin items
  const superAdminItems = isSuperAdmin
    && !isSuperAdminOrgWorkspace
    ? [
        {
          icon: (
            <i
              className="icon-[lucide--building-2] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Todas las organizaciones",
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
              className="icon-[lucide--download] size-5"
              role="img"
              aria-hidden="true"
            />
          ),
          text: "Recursos descargables",
          to: "/app/superadmin/lead-magnets",
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

  // Grupos con etiqueta de registro (BRAND.md § Layout): casos → organización
  // → plataforma (superadmin) → cuenta.
  const navGroups = [
    { label: "Casos", items: baseItems },
    { label: "Organización", items: [...adminItems, ...memberItems] },
    { label: "Plataforma", items: superAdminItems },
    { label: "Cuenta", items: [profileItem] },
  ].filter((g) => g.items.length > 0);

  return (
    <aside
      className={`${
        isCollapsed ? "w-[76px]" : "w-[264px]"
      } ev-sidebar-surface relative z-10 flex h-screen flex-col overflow-hidden transition-[width] duration-300 ease-ev-out`}
    >
      {/* Marca: siempre EthicVoice, nunca el logo de la organización en contexto
          (organizationLogoUrl es para superficies de la organización, como /submit). */}
      <div
        className={`flex h-16 shrink-0 items-center ${
          isCollapsed ? "justify-center" : "px-5"
        }`}
      >
        <Link href="/app" aria-label="EthicVoice — inicio" className="flex items-center">
          {isCollapsed ? (
            <LogoMark tone="dark" className="h-7 w-auto" />
          ) : (
            <Logo tone="dark" markClassName="h-7 w-auto" />
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-3" aria-label="Aplicación">
        {isSuperAdminOrgWorkspace && !isCollapsed && (
          <button
            type="button"
            onClick={returnToSuperAdminPanel}
            className="ev-press mb-4 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-white/75 hover:border-white/25 hover:text-white"
          >
            <i className="icon-[lucide--arrow-left] size-4" aria-hidden />
            Volver a Super Admin
          </button>
        )}
        {/* Mientras cargan los permisos no mostramos el menú de otro rol
            (antes aparecía por un instante la vista de investigador). */}
        {roleLoading && (
          <div className="space-y-2 px-3 pt-2" aria-hidden>
            {[70, 55, 62, 48, 58, 66].map((w, i) => (
              <div key={i} className="flex h-10 items-center gap-3">
                <span className="h-4 w-4 rounded bg-white/10" />
                {!isCollapsed && <span className="h-2.5 rounded-full bg-white/10" style={{ width: `${w}%` }} />}
              </div>
            ))}
          </div>
        )}
        {!roleLoading && navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-6" : ""}>
            <p
              className={`ev-label mb-2 px-3 text-white/35 transition-opacity duration-200 ${
                isCollapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100"
              }`}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
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
        ))}
      </nav>

      {/* Usuario y salida */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <SignedIn>
          <div
            className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/15"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ev-slate font-mono text-xs text-ev-signal">
                {(user?.firstName?.[0] ?? "E").toUpperCase()}
              </span>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user?.fullName || "Usuario"}
                </p>
                <p className="truncate text-xs text-white/45">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <SignOutButton redirectUrl="/auth/sign-in">
                <button
                  type="button"
                  disabled={isLoading}
                  className="ev-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <i className="icon-[lucide--log-out] size-4" aria-hidden />
                </button>
              </SignOutButton>
            )}
          </div>
          {isCollapsed && (
            <SignOutButton redirectUrl="/auth/sign-in">
              <button
                type="button"
                className="ev-press mt-1 flex h-9 w-full items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar sesión"
              >
                <i className="icon-[lucide--log-out] size-4" aria-hidden />
              </button>
            </SignOutButton>
          )}
        </SignedIn>
      </div>
    </aside>
  );
};
