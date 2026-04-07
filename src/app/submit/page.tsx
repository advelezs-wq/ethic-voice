import { getActiveOrganizations } from "@/actions/ethicline.actions";
import { SubmitPageWrapper } from "@/modules/submit/components/SubmitPageWrapper";
import { Organization } from "@prisma/client";

export default async function SubmitPage() {
  const organizations = await getActiveOrganizations();

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-gradient-to-br from-[#f5f3ee] via-white to-emerald-50/20">
      <SubmitPageWrapper organizations={organizations as Organization[]} />
    </div>
  );
}
