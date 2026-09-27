import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClientsManager } from "@/modules/app/components/dashboard/super-admin/ClientsManager";
import { SuperAdminPanelShell } from "@/modules/app/components/dashboard/super-admin/SuperAdminPanelShell";

export default async function SuperAdminClientsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    redirect("/app");
  }

  return (
    <SuperAdminPanelShell
      title="Clientes"
      subtitle="Crea clientes, asígnales un plan y administra su suscripción y su acceso desde un solo lugar."
    >
      <ClientsManager />
    </SuperAdminPanelShell>
  );
}
