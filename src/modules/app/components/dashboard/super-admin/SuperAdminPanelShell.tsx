import Link from "next/link";
import React from "react";

interface SuperAdminPanelShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/app",
    label: "Dashboard",
    icon: "icon-[lucide--layout-dashboard]",
  },
  {
    href: "/app/organizations",
    label: "Organizaciones",
    icon: "icon-[lucide--building]",
  },
  {
    href: "/app/superadmin/clients",
    label: "Clientes",
    icon: "icon-[lucide--building-2]",
  },
  {
    href: "/app/superadmin/tools",
    label: "Herramientas",
    icon: "icon-[lucide--wrench]",
  },
  {
    href: "/app/superadmin/leads",
    label: "Leads",
    icon: "icon-[lucide--book-user]",
  },
  {
    href: "/app/superadmin/blog",
    label: "Blog",
    icon: "icon-[lucide--newspaper]",
  },
];

const QUICK_ACTIONS = [
  {
    href: "/app/organizations",
    label: "Gestionar organización",
    hint: "Operativo",
  },
  {
    href: "/app/superadmin/clients",
    label: "Alta de cliente",
    hint: "Operativo",
  },
  {
    href: "/app/superadmin/tools",
    label: "Procesar colas",
    hint: "Crítico",
  },
  {
    href: "/app/superadmin/leads",
    label: "Revisar leads",
    hint: "Comercial",
  },
];

export function SuperAdminPanelShell({
  title,
  subtitle,
  children,
}: SuperAdminPanelShellProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7faf9]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(94,210,156,0.16),transparent_46%)]" />
      <div className="pointer-events-none absolute right-[-220px] top-[-120px] h-[420px] w-[420px] rounded-full bg-lime-300/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-10">
        <header className="overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-[#051a24] via-[#0d212c] to-[#041018] p-6 text-white shadow-[0_24px_60px_-30px_rgba(5,26,36,0.75)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">
            EthicVoice · Super Admin
          </p>
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-slate-200 sm:text-base">{subtitle}</p>
            </div>
            <nav className="mt-3 flex flex-wrap gap-2 lg:mt-0">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-100 transition hover:border-lime-300/60 hover:bg-lime-300/20 sm:text-sm"
                >
                  <i className={`${item.icon} size-4`} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-200">
              Atajos rápidos
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-lime-300/60 hover:bg-lime-300/20"
                >
                  <span>{action.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      action.hint === "Crítico"
                        ? "bg-danger-400/70 text-white"
                        : action.hint === "Operativo"
                          ? "bg-primary-400/70 text-white"
                          : "bg-lime-300/70 text-[#052b24]"
                    }`}
                  >
                    {action.hint}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </header>

        <div className="relative">{children}</div>
      </div>
    </section>
  );
}
