import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LeadMagnetsManager from "@/modules/app/components/dashboard/super-admin/LeadMagnetsManager";
import { SuperAdminPanelShell } from "@/modules/app/components/dashboard/super-admin/SuperAdminPanelShell";

export default async function SuperAdminLeadMagnetsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) {
    redirect("/app");
  }

  return (
    <SuperAdminPanelShell
      title="Recursos descargables"
      subtitle="Crea y administra lead magnets (ebooks, guías, checklists, plantillas) con captura de leads por campaña, sin tocar código."
    >
      <LeadMagnetsManager />
    </SuperAdminPanelShell>
  );
}
