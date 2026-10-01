"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { useUserRole } from "@/modules/core/hooks/useUserRole";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

type Status = {
  isSuperAdmin?: boolean;
  orgIsActive?: boolean | null;
};

/**
 * Estado del plan de la organización activa:
 *  - superadmin: sin restricciones.
 *  - organización suspendida por EthicVoice: pantalla de acceso suspendido.
 *  - organización sin plan activo: aviso con el siguiente paso (el
 *    administrador elige un plan; el resto de miembros le avisa). Las
 *    restricciones por plan las aplica el middleware.
 * Antes este componente verificaba los retornos de la pasarela anterior y,
 * si algo fallaba, obligaba a cerrar sesión.
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isLoaded, user } = useUser();
  const { currentOrganization } = useOrganization();
  const pathname = usePathname();
  const { organizationRole } = useUserRole();
  const isOrgAdmin = organizationRole === "ADMIN";
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    let cancelled = false;
    fetch("/api/users/org-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setStatus(d ?? {}))
      .catch(() => !cancelled && setStatus({}));
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, currentOrganization?.id]);

  const org = currentOrganization as unknown as { id?: string; name?: string; hasActivePlan?: boolean; isActive?: boolean } | null;

  if (status?.isSuperAdmin) return <>{children}</>;

  if (status?.orgIsActive === false || org?.isActive === false) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-ev-line bg-white p-8 text-center">
          <p className="ev-label text-[#B23A28]">Acceso suspendido</p>
          <h1 className="mt-3 text-xl font-semibold text-ev-night">El acceso de tu organización está suspendido</h1>
          <p className="mt-2 text-sm text-ev-mute">
            Tus datos se conservan. Escríbenos a{" "}
            <a className="underline" href="mailto:support@ethicvoice.co">support@ethicvoice.co</a> para reactivarlo.
          </p>
        </div>
      </div>
    );
  }

  const onBilling = pathname?.startsWith("/app/billing") || pathname?.startsWith("/app/onboarding");
  const noPlan = org?.id && org.hasActivePlan === false && !onBilling;

  return (
    <>
      {noPlan && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EBCB8B] bg-[#FBF0DC] px-5 py-4 text-sm text-[#6B4510]">
          <p>
            <strong className="font-semibold">{org?.name ?? "Tu organización"} no tiene un plan activo.</strong>{" "}
            {isOrgAdmin
              ? "Elige un plan para recibir denuncias y usar todas las herramientas."
              : "Pide al administrador de tu organización que active un plan."}
          </p>
          {isOrgAdmin && (
            <Link href="/app/billing" className="inline-flex h-9 items-center rounded-full bg-ev-night px-4 text-sm font-medium text-white hover:bg-ev-slate">
              Ir a Facturación
            </Link>
          )}
        </div>
      )}
      {children}
    </>
  );
}
