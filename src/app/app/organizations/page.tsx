"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Spinner } from "@heroui/react";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { SuperAdminOrganizationsView } from "@/modules/app/components/dashboard/super-admin/SuperAdminOrganizationsView";

/**
 * Listado de organizaciones: solo para superadmins. Los clientes se crean
 * desde Superadmin → Clientes, y cada cliente crea la suya en /checkout.
 */
export default function OrganizationsPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const email = user?.primaryEmailAddress?.emailAddress;
  const superAdmin = Boolean(email && isSuperAdmin(email));

  useEffect(() => {
    if (isLoaded && !superAdmin) router.replace("/app");
  }, [isLoaded, superAdmin, router]);

  if (!isLoaded || !superAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return <SuperAdminOrganizationsView />;
}
