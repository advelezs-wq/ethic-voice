import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SuperAdminBlogList } from "@/modules/blog/components/SuperAdminBlogList";
import { SuperAdminPanelShell } from "@/modules/app/components/dashboard/super-admin/SuperAdminPanelShell";

export default async function SuperAdminBlogPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");

  return (
    <SuperAdminPanelShell
      title="Blog Público"
      subtitle="Gestiona contenido editorial con foco en publicación y revisión."
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-sm text-default-500">
            Cargando…
          </div>
        }
      >
        <SuperAdminBlogList />
      </Suspense>
    </SuperAdminPanelShell>
  );
}
