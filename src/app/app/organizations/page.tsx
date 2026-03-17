"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
// Replaced standalone org creation with manual client creation flow
import SuperAdminManualClient from "@/modules/app/components/dashboard/super-admin/ManualClientCreator";
import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { SuperAdminOrganizationsView } from "@/modules/app/components/dashboard/super-admin/SuperAdminOrganizationsView";

interface PendingSubscription {
  id: string;
  planType: string;
  planName: string;
  status: string;
  isTrialActive: boolean;
}

export default function OrganizationsPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingSubscription, setPendingSubscription] =
    useState<PendingSubscription | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);

  // URL params for subscription handling
  const subscriptionId = searchParams.get("subscription_id");
  const autoSetup = searchParams.get("auto_setup") === "true";

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkStatusAndSetup = async () => {
      try {
        console.log("🔍 Checking organization status...");

        // Check user organization status
        const response = await fetch("/api/users/org-status");
        const data = await response.json();

        console.log("📋 Organization status:", data);

        if (data.pendingSubscription) {
          setPendingSubscription(data.pendingSubscription);

          // If auto setup is enabled or subscription_id in URL, show create form
          if (autoSetup || subscriptionId === data.pendingSubscription.id) {
            console.log(
              "🔄 Auto-starting organization setup with subscription"
            );
            setShowCreateForm(true);
          }
        }

        // If user already has organization, redirect to their dashboard
        setHasOrganization(!!data.hasOrganization);
        if (data.hasOrganization && data.organizationId) {
          console.log("✅ User has organization, redirecting to dashboard");
          router.push(`/app`);
          return;
        }

        // ✅ Super admin bypass: Super admins don't need subscriptions
        if (data.isSuperAdmin) {
          console.log("👑 Super admin detected, bypassing subscription checks");
          setIsCheckingStatus(false);
          // Let super admins access organizations page without subscription
          return;
        }

        // If no pending subscription and no organization, redirect to pricing
        if (!data.pendingSubscription && !data.hasOrganization) {
          console.log(
            "🔄 No subscription or organization, redirecting to pricing"
          );
          router.push("/pricing");
          return;
        }
      } catch (error) {
        console.error("❌ Error checking status:", error);
        // Continue to show create form as fallback
        setShowCreateForm(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatusAndSetup();
  }, [isLoaded, user, router, subscriptionId, autoSetup]);

  const handleLinkSubscription = async (organizationId: string) => {
    if (!pendingSubscription) return;

    try {
      console.log("🔗 Linking subscription to organization:", {
        subscriptionId: pendingSubscription.id,
        organizationId,
      });

      const response = await fetch("/api/organization/link-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: pendingSubscription.id,
          organizationId,
        }),
      });

      if (response.ok) {
        console.log("✅ Subscription linked successfully");
        router.push(`/app?subscription_activated=true`);
      } else {
        console.error("❌ Failed to link subscription");
        router.push(`/app`);
      }
    } catch (error) {
      console.error("❌ Error linking subscription:", error);
      router.push(`/app`);
    }
  };

  const handleStartFresh = () => {
    router.push("/pricing");
  };

  if (!isLoaded || isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-8">
            <Spinner size="lg" color="primary" className="mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading your workspace...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your dashboard.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Remove standalone creation UI: for super admins, show manual client creator; for regular users, follow checkout/onboarding
  if (showCreateForm || (pendingSubscription && !hasOrganization)) {
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const isUserSuperAdmin = userEmail && isSuperAdmin(userEmail);
    if (isUserSuperAdmin) {
      return <SuperAdminManualClient />;
    }
    // Regular users are redirected to pricing/onboarding elsewhere; keep a minimal message
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardBody className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Completa tu compra para crear la organización</h3>
            <Button color="primary" onPress={() => router.push("/pricing")}>Ir a planes</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ✅ Check if user is super admin - show organizations management
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isUserSuperAdmin = userEmail && isSuperAdmin(userEmail);

  // Super admin sees organizations management
  if (isUserSuperAdmin) {
    return <SuperAdminOrganizationsView />;
  }

  // Fallback UI for edge cases (regular users)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to EthicVoice
          </h1>
        </CardHeader>
        <CardBody className="text-center space-y-4">
          {pendingSubscription ? (
            <>
              <div className="bg-green-50 rounded-lg p-4">
                <i className="icon-[lucide--check-circle] w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-800">
                  You have an active{" "}
                  <strong>{pendingSubscription.planName}</strong>
                </p>
              </div>
              <p className="text-gray-600">
                Ready to create your organization and start using all the
                features included in your plan.
              </p>
              <Button
                color="primary"
                size="lg"
                onClick={() => setShowCreateForm(true)}
                className="w-full"
              >
                Create Organization
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                You need an active subscription to create an organization.
              </p>
              <Button
                color="primary"
                size="lg"
                onClick={handleStartFresh}
                className="w-full"
              >
                View Pricing Plans
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
