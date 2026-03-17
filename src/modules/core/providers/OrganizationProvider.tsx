/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@heroui/react";
import { useOrganizationStore } from "@/modules/store/organization.store";
import { useSubscription } from "./SubscriptionProvider";
import { isSuperAdmin } from "../utils/permissions";

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [orgLoaded, setOrgLoaded] = useState(false);
  const [dbOrgs, setDbOrgs] = useState<any[] | null>(null);

  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const { setHasCompletedSetup, setOrganizations, setCurrentOrganization, setIsLoading } =
    useOrganizationStore();
  const {
    forceOrganizationRefresh,
    markOnboardingCompleted,
    needsOnboarding: subscriptionNeedsOnboarding,
    hasActiveSubscription,
    isLoading: subscriptionLoading,
  } = useSubscription();

  const hasProcessedOrgs = useRef(false);
  const redirectAttempts = useRef(0);
  const lastLogTime = useRef(0);

  // Memoize super admin check to prevent excessive calls
  const isUserSuperAdmin = useMemo(() => {
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    return userLoaded && userEmail && isSuperAdmin(userEmail);
  }, [user?.primaryEmailAddress?.emailAddress, userLoaded]);

  // Function to handle when user needs to create organization
  const redirectToOnboarding = () => {
    // Prevent redirect loops
    if (redirectAttempts.current >= 2) {
      console.warn("🚨 [ORG-PROVIDER] Too many redirect attempts, stopping");
      return;
    }

    // Don't redirect if already in onboarding
    if (pathname?.includes("/onboarding")) {
      console.log("ℹ️ [ORG-PROVIDER] Already in onboarding, skipping redirect");
      return;
    }

    console.log("🚀 [ORG-PROVIDER] Redirecting to onboarding page");
    redirectAttempts.current++;
    router.push("/app/onboarding");
  };

  // Check if user has completed onboarding (localStorage fallback)
  const hasCompletedOnboardingLocally = useMemo(() => {
    if (typeof window === "undefined" || !user?.id) return false;
    const key = `onboarding_completed_${user.id}`;
    return localStorage.getItem(key) === "true";
  }, [user?.id]);

  useEffect(() => {
    // Don't process if still loading basic data
    if (!userLoaded || !orgLoaded || subscriptionLoading) {
      return;
    }

    const hasOrganizations = Array.isArray(dbOrgs) && dbOrgs.length > 0;

    // Throttle logging to avoid spam
    const now = Date.now();
    if (now - lastLogTime.current > 2000) {
      console.log("🔍 [ORG-PROVIDER] Checking organization status:", {
        hasOrganizations,
        hasActiveSubscription,
        subscriptionNeedsOnboarding,
        isUserSuperAdmin,
        pathname,
        hasCompletedOnboardingLocally,
        redirectAttempts: redirectAttempts.current,
        subscriptionLoading,
      });
      lastLogTime.current = now;
    }

    // PRIORITY 1: If user has organizations, they don't need onboarding
    if (hasOrganizations && !hasProcessedOrgs.current) {
      console.log("✅ [ORG-PROVIDER] User has organizations, processing them");
      hasProcessedOrgs.current = true;
      setNeedsOnboarding(false);
      setHasCompletedSetup(true);

      // Mark onboarding as completed in localStorage
      if (user?.id) {
        const key = `onboarding_completed_${user.id}`;
        localStorage.setItem(key, "true");
      }

      // Update Zustand store with DB organization data
      const transformedOrgs = (dbOrgs || []).map((org: any) => ({
        id: String(org.id),
        createdAt: new Date(org.createdAt),
        updatedAt: new Date(org.updatedAt),
        name: String(org.name ?? ""),
        slug: String(org.slug ?? ""),
        logoUrl: (org.logoUrl as string) ?? null,
        brandColor: null,
        isActive: Boolean(org.isActive),
        currentPlan: org.currentPlan ?? null,
        hasActivePlan: Boolean(org.hasActivePlan),
        isEmailChannelActive: false,
        isAiProcessingActive: false,
        isChatbotActive: false,
        isPhoneChannelActive: false,
        subscriptionSetupCompleted: false,
        currentUsers: 0,
        currentInvestigators: 0,
        maxUsers: 0,
        maxInvestigators: 0,
        maxEmployees: 0,
        planExpiresAt: null,
        emailReportsCount: 0,
        aiProcessingCount: 0,
        totalSubmissions: 0,
        customFormSubmissions: 0,
        userId: user?.id ?? "",
        organizationId: String(org.id),
        ethicLineSubmissions: 0,
      }));

      setOrganizations(transformedOrgs);

      // Set the first organization as current if none is set and persist cookie for server
      if (transformedOrgs.length > 0) {
        const firstOrg = transformedOrgs[0];
        setCurrentOrganization(firstOrg);
        try {
          document.cookie = `ev_org=${firstOrg.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
        } catch {}
      }

      // Mark onboarding as completed
      markOnboardingCompleted();
    }
    // PRIORITY 2: Only redirect to onboarding if all conditions are met
    else if (
      user &&
      subscriptionNeedsOnboarding &&
      !isUserSuperAdmin &&
      !hasOrganizations &&
      !hasCompletedOnboardingLocally &&
      needsOnboarding === null &&
      redirectAttempts.current < 2
    ) {
      console.log(
        "✅ [ORG-PROVIDER] User has active subscription and needs onboarding"
      );
      setNeedsOnboarding(true);
      setHasCompletedSetup(false);
      redirectToOnboarding();
    }
    // PRIORITY 3: If user has no active subscription and no organizations, let SubscriptionProvider handle it
    else if (
      user &&
      !hasActiveSubscription &&
      !hasOrganizations &&
      !isUserSuperAdmin &&
      !subscriptionLoading // Don't act while still loading subscription data
    ) {
      console.log(
        "ℹ️ [ORG-PROVIDER] User has no subscription - letting SubscriptionProvider handle"
      );
      setNeedsOnboarding(false);
      setHasCompletedSetup(false);
      // Don't redirect to onboarding - let SubscriptionProvider show pricing modal
    }
    // PRIORITY 4: User completed onboarding locally but might be in a weird state
    else if (
      user &&
      hasCompletedOnboardingLocally &&
      !hasOrganizations &&
      needsOnboarding === null &&
      !subscriptionLoading
    ) {
      console.log(
        "ℹ️ [ORG-PROVIDER] User completed onboarding locally but has no orgs, checking again"
      );
      setNeedsOnboarding(false);
      setHasCompletedSetup(true);
    }
  }, [
    userLoaded,
    orgLoaded,
    user,
    isUserSuperAdmin,
    subscriptionNeedsOnboarding,
    hasActiveSubscription,
    needsOnboarding,
    hasCompletedOnboardingLocally,
    pathname,
    setHasCompletedSetup,
    setOrganizations,
    setCurrentOrganization,
    markOnboardingCompleted,
    subscriptionLoading,
  ]);

  // Enhanced organization refresh functionality
  useEffect(() => {
    if (forceOrganizationRefresh) {
      console.log("🔄 [ORG-PROVIDER] Forcing organization refresh");
      hasProcessedOrgs.current = false;
      setNeedsOnboarding(null);
      redirectAttempts.current = 0; // Reset redirect attempts
    }
  }, [forceOrganizationRefresh]);

  // Load DB organizations
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/organizations", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setDbOrgs(data.organizations || []);

          // Sanitize persisted organization: drop legacy Clerk org ids or unknown orgs
          try {
            const persisted = useOrganizationStore.getState().currentOrganization as any;
            const orgs: any[] = data.organizations || [];
            const isPersistedInvalid =
              persisted &&
              (String(persisted.id || "").startsWith("org_") ||
                !orgs.some((o) => String(o.id) === String(persisted.id)));
            if (isPersistedInvalid) {
              setCurrentOrganization(null);
            }
          } catch {}

          // If no DB orgs, mark setup as incomplete so onboarding can proceed
          if (!data.organizations || data.organizations.length === 0) {
            setHasCompletedSetup(false);
          }
        } else {
          setDbOrgs([]);
        }
      } catch {
        setDbOrgs([]);
      } finally {
        setOrgLoaded(true);
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Organization count change detection (for subscription linking)
  useEffect(() => {
    const currentOrgCount = Array.isArray(dbOrgs) ? dbOrgs.length : 0;
    if (orgLoaded && currentOrgCount > 0) {
      console.log(
        `📊 [ORG-PROVIDER] Organization count changed: ${currentOrgCount}`
      );

      if (currentOrgCount > 0 && needsOnboarding === true) {
        console.log(
          "🎉 [ORG-PROVIDER] Organization created during onboarding!"
        );
        setNeedsOnboarding(false);
        setHasCompletedSetup(true);
        markOnboardingCompleted();

        // Mark onboarding as completed in localStorage
        if (user?.id) {
          const key = `onboarding_completed_${user.id}`;
          localStorage.setItem(key, "true");
        }

        // Navigate to their new organization
        const firstOrg = (dbOrgs || [])[0];
        if (firstOrg && pathname?.includes("/onboarding")) {
          router.push(`/app`);
        }
      }
    }
  }, [
    dbOrgs,
    orgLoaded,
    needsOnboarding,
    markOnboardingCompleted,
    pathname,
    router,
    user?.id,
  ]);

  // Show loading spinner while checking user and organization status
  if (!userLoaded || !orgLoaded || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
