import { getActiveOrganizations } from "@/actions/ethicline.actions";
import { SubmitPageWrapper } from "@/modules/submit/components/SubmitPageWrapper";
import { Organization } from "@prisma/client";

export default async function SubmitPage() {
  const organizations = await getActiveOrganizations();

  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50/30">
      <SubmitPageWrapper organizations={organizations as Organization[]} />
    </main>
  );
}
