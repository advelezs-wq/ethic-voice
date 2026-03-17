import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import SuperAdminTools from "@/modules/app/components/dashboard/super-admin/SuperAdminTools";
import { redirect } from "next/navigation";

export default async function SuperAdminToolsPage() {
  const me = await currentUser();
  const email = me?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");
  return <SuperAdminTools />;
}


