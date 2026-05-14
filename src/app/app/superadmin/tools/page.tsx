import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import SuperAdminTools from "@/modules/app/components/dashboard/super-admin/SuperAdminTools";
import { redirect } from "next/navigation";
import { SuperAdminPanelShell } from "@/modules/app/components/dashboard/super-admin/SuperAdminPanelShell";

export default async function SuperAdminToolsPage() {
  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");
  return (
    <SuperAdminPanelShell
      title="Herramientas Operativas"
      subtitle="Acciones internas para ejecución de procesos y mantenimiento."
    >
      <SuperAdminTools />
    </SuperAdminPanelShell>
  );
}


