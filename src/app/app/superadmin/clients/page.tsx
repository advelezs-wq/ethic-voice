import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ManualClientCreator from "@/modules/app/components/dashboard/super-admin/ManualClientCreator";
import SuperAdminClientsTable from "@/modules/app/components/dashboard/super-admin/SuperAdminClientsTable";
import { SuperAdminPanelShell } from "@/modules/app/components/dashboard/super-admin/SuperAdminPanelShell";

export default async function SuperAdminClientsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    redirect("/app");
  }

  return (
    <SuperAdminPanelShell
      title="Clientes y Suscripciones"
      subtitle="Crea cuentas, revisa estado comercial y ejecuta acciones de suscripción con claridad."
    >
      <div className="space-y-6">
        <ManualClientCreator />
        <SuperAdminClientsTable />
      </div>
    </SuperAdminPanelShell>
  );
}


