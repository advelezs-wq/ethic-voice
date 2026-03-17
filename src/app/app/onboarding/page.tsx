import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "@/modules/app/components/onboarding/OnboardingClient";

// Force dynamic rendering since this uses auth
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId } = await auth();

  // If user is not authenticated, redirect to sign-in
  if (!userId) {
    redirect("/auth/sign-in");
  }

  // Org presence is handled by middleware and OrganizationProvider
  return <OnboardingClient />;
}
