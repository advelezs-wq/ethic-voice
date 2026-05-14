import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SuperAdminEbookLeadsTable } from "@/modules/app/components/dashboard/super-admin/SuperAdminEbookLeadsTable";
import { SuperAdminPanelShell } from "@/modules/app/components/dashboard/super-admin/SuperAdminPanelShell";

export default async function SuperAdminLeadsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");

  return (
    <SuperAdminPanelShell
      title="Leads de Ebook"
      subtitle="Analiza la captación de la landing y su calidad por campaña."
    >
      <div className="space-y-4">
        <p className="text-sm text-default-600">
          El archivo servido por defecto es{" "}
          <code className="rounded bg-default-100 px-1 py-0.5 text-xs">/ebook/ebook_ethicvoice.pdf</code> (configurable con{" "}
          <code className="rounded bg-default-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_EBOOK_PDF_URL</code>).
        </p>
        <Suspense
          fallback={
            <div className="flex justify-center py-16 text-sm text-default-500">Cargando…</div>
          }
        >
          <SuperAdminEbookLeadsTable />
        </Suspense>
      </div>
    </SuperAdminPanelShell>
  );
}
