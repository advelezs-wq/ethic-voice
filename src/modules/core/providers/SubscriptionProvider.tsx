/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { Subscription } from "@/types/subscription.types";

interface SubscriptionContextType {
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  hasOrganization: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  shouldShowSubscriptionSuccess: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  forceOrganizationRefresh: boolean;
  markOnboardingCompleted: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forceOrganizationRefresh, setForceOrganizationRefresh] =
    useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);

  const fetchedSubscription = useRef(false);
  const processedSuccess = useRef(false);

  // Check if user is in onboarding flow
  const isInOnboardingFlow = pathname?.includes("/onboarding") || false;

  // Check if this is a subscription success redirect
  const isSubscriptionSuccessPage =
    pathname === "/app" && searchParams.get("payment") === "success";

  const hasOrgs = false; // do not infer from Clerk; rely on DB flags

  const fetchSubscriptionStatus = async () => {
    if (!user?.id || fetchedSubscription.current) return;

    try {
      setIsLoading(true);
      fetchedSubscription.current = true;

      const response = await fetch("/api/users/org-status");
      if (response.ok) {
        const data = await response.json();

        console.log("📊 [SUBSCRIPTION-PROVIDER] Fetched user status:", {
          hasActiveSubscription: data.hasActiveSubscription,
          hasOrganization: data.hasOrganization,
          subscription: data.subscription,
          needsOnboarding: data.needsOnboarding,
          debug: data.debug?.subscriptions?.length || 0,
        });

        // Store the complete user status
        setUserStatus(data);

        // Set subscription from the API response
        if (data.subscription) {
          setSubscription(data.subscription);

          // Store subscription ID for onboarding linking (only for ACTIVE subscriptions)
          if (
            data.subscription.id &&
            !data.subscription.organizationId &&
            data.subscription.status === "ACTIVE"
          ) {
            localStorage.setItem(
              "pendingSubscriptionId",
              data.subscription.id.toString()
            );
          }
        } else if (data.debug?.subscriptions?.length > 0) {
          // Fallback: use the first active subscription from debug data
          const activeSubscription = data.debug.subscriptions.find(
            (sub: any) => sub.status === "ACTIVE"
          );
          if (activeSubscription) {
            setSubscription(activeSubscription);

            if (activeSubscription.id && !activeSubscription.organizationId) {
              localStorage.setItem(
                "pendingSubscriptionId",
                activeSubscription.id.toString()
              );
            }
          }
        }

        setHasCompletedOnboarding(data.hasCompletedOnboarding || false);
      } else {
        console.error(
          "❌ [SUBSCRIPTION-PROVIDER] Failed to fetch user status:",
          response.status
        );
      }
    } catch (error) {
      console.error(
        "❌ [SUBSCRIPTION-PROVIDER] Error fetching subscription:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    fetchedSubscription.current = false;
    await fetchSubscriptionStatus();
  };

  const markOnboardingCompleted = () => {
    setHasCompletedOnboarding(true);
    setForceOrganizationRefresh(true);

    setTimeout(() => {
      setForceOrganizationRefresh(false);
    }, 1000);
  };

  // Fetch subscription on mount and user change
  useEffect(() => {
    if (userLoaded && user?.id) {
      fetchSubscriptionStatus();
    }
  }, [userLoaded, user?.id]);

  // Handle subscription success redirect
  useEffect(() => {
    if (
      isSubscriptionSuccessPage &&
      !processedSuccess.current &&
      userLoaded &&
      user?.id
    ) {
      const subscriptionId = searchParams.get("subscription_id");

      if (subscriptionId) {
        console.log(
          "🎉 [SUBSCRIPTION-PROVIDER] Processing payment success:",
          subscriptionId
        );
        processedSuccess.current = true;

        // Store subscription ID for linking during onboarding
        localStorage.setItem("pendingSubscriptionId", subscriptionId);

        // Verify the subscription
        const verifyPayment = async () => {
          try {
            const response = await fetch("/api/payments/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subscriptionId }),
            });

            if (response.ok) {
              const result = await response.json();
              console.log(
                "✅ [SUBSCRIPTION-PROVIDER] Payment verified:",
                result
              );

              // Refresh subscription status
              await refreshSubscriptionStatus();

              // Clean URL parameters
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete("payment");
              newUrl.searchParams.delete("subscription_id");
              window.history.replaceState({}, "", newUrl.toString());
            }
          } catch (error) {
            console.error(
              "❌ [SUBSCRIPTION-PROVIDER] Payment verification failed:",
              error
            );
          }
        };

        verifyPayment();
      }
    }
  }, [isSubscriptionSuccessPage, searchParams, userLoaded, user?.id, pathname]);

  // Calculate values from userStatus or fallback
  // ✅ CRITICAL: Only treat ACTIVE subscriptions as truly active
  const hasActiveSubscription =
    userStatus?.hasActiveSubscription ||
    (subscription && subscription.status === "ACTIVE") || // Only ACTIVE, not TRIALING
    false;

  // ✅ Only trust DB-backed flag from org-status; do not infer from Clerk orgs alone
  const hasOrganization = userStatus?.dbHasOrganizations || false;

  // ✅ CRITICAL: Only need onboarding if ACTIVE subscription + no organization
  const needsOnboarding =
    userStatus?.needsOnboarding ||
    (hasActiveSubscription && !hasOrganization) ||
    false;

  const contextValue: SubscriptionContextType = {
    subscription,
    hasActiveSubscription,
    hasOrganization,
    isLoading: isLoading,
    needsOnboarding,
    shouldShowSubscriptionSuccess:
      !hasCompletedOnboarding && isInOnboardingFlow && !hasOrganization && !!subscription,
    refreshSubscriptionStatus,
    forceOrganizationRefresh,
    markOnboardingCompleted,
  };

  console.log("🔍 [SUBSCRIPTION-PROVIDER] Context values:", {
    hasActiveSubscription,
    hasOrganization,
    needsOnboarding,
    isLoading,
    subscriptionId: subscription?.id,
    subscriptionStatus: subscription?.status,
    userHasTrialingOnly:
      subscription?.status === "TRIALING" && !hasActiveSubscription,
  });

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
