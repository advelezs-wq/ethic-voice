import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SecurityDashboard } from "@/modules/app/components/security/SecurityDashboard";
import { isSuperAdmin } from "@/modules/core/utils/permissions";

export default async function SecurityPage() {
  // Get authenticated user
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Get user data from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect("/auth/sign-in");
  }

  // Check if user is super admin based on email
  const userEmail = clerkUser.primaryEmailAddress?.emailAddress;
  if (!userEmail || !isSuperAdmin(userEmail)) {
    redirect("/app"); // Redirect to dashboard if not super admin
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <SecurityDashboard userRole="SUPER_ADMIN" />
    </div>
  );
} 