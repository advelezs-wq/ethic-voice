import { redirect } from "next/navigation";

export default function ArchivedReportsRedirect() {
  // Redirect to main reports page with archived tab
  redirect("/app/reports?tab=archived");
}
