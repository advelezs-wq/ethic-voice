import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SuperAdminBlogList } from "@/modules/blog/components/SuperAdminBlogList";

export default async function SuperAdminBlogPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Blog</h1>
        <p className="mt-1 text-sm text-default-500">
          Crea y publica artículos en el blog público de EthicVoice.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-16 text-sm text-default-500">
            Cargando…
          </div>
        }
      >
        <SuperAdminBlogList />
      </Suspense>
    </div>
  );
}
