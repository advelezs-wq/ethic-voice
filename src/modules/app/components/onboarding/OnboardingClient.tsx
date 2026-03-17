"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { OnboardingLayout } from "./OnboardingLayout";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ThemeSelectionStep } from "./steps/ThemeSelectionStep";
import { NotificationStep } from "./steps/NotificationStep";
import { CreateOrganizationStep } from "./steps/CreateOrganizationStep";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import { PlanType } from "@/types/subscription.types";
import { useSubscription } from "@/modules/core/providers/SubscriptionProvider";

export enum OnboardingStep {
  WELCOME = "welcome",
  THEME_SELECTION = "theme_selection",
  NOTIFICATIONS = "notifications",
  CREATE_ORGANIZATION = "create_organization",
}

interface NotificationSettings {
  emailReportAssigned: boolean;
  emailReportStatusChanged: boolean;
  emailReportComment: boolean;
  inAppReportAssigned: boolean;
  inAppReportStatusChanged: boolean;
  inAppReportComment: boolean;
  enableDailyDigest: boolean;
  enableWeeklyDigest: boolean;
}

export interface OnboardingContextType {
  currentStep: OnboardingStep;
  selectedTheme: string;
  notificationSettings: NotificationSettings;
  setCurrentStep: (step: OnboardingStep) => void;
  setSelectedTheme: (theme: string) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isCreatingOrganization: boolean;
  setIsCreatingOrganization: (loading: boolean) => void;
  organizationData: {
    organizationName: string;
    description?: string;
    organizationType: string;
    teamSize: string;
  } | null;
  setOrganizationData: (data: {
    organizationName: string;
    description?: string;
    organizationType: string;
    teamSize: string;
  }) => void;
  availableSteps: OnboardingStep[];
}

// Dynamic step order based on plan
const baseSteps = [
  OnboardingStep.WELCOME,
  OnboardingStep.NOTIFICATIONS,
  OnboardingStep.CREATE_ORGANIZATION,
];

export function OnboardingClient() {
  const router = useRouter();
  const { currentOrganization, organizations } = useOrganization();
  const { planInfo, isLoading: planLoading } = usePlanPermissions();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME
  );
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailReportAssigned: true,
      emailReportStatusChanged: true,
      emailReportComment: false,
      inAppReportAssigned: true,
      inAppReportStatusChanged: true,
      inAppReportComment: true,
      enableDailyDigest: false,
      enableWeeklyDigest: true,
    });
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [organizationData, setOrganizationData] = useState<{
    organizationName: string;
    description?: string;
    organizationType: string;
    teamSize: string;
  } | null>(null);

  // Determine if theme selection is allowed (Grow or higher)
  // Determine effective plan type: prefer org-based plan; fallback to subscription during onboarding
  const subscriptionPlan = (subscription?.planType || "") as string;
  const normalizedSubscriptionPlan = subscriptionPlan.toUpperCase() as keyof typeof PlanType;
  const effectivePlanType: PlanType | null = currentOrganization?.id
    ? planInfo?.planType ?? null
    : (PlanType[normalizedSubscriptionPlan] as PlanType) || null;

  const allowThemeSelection =
    effectivePlanType === PlanType.GROW ||
    effectivePlanType === PlanType.GROW_PRO ||
    effectivePlanType === PlanType.PREMIUM;

  const computedStepOrder: OnboardingStep[] = allowThemeSelection
    ? [OnboardingStep.WELCOME, OnboardingStep.THEME_SELECTION, ...baseSteps.slice(1)]
    : [...baseSteps];

  // Helper: scroll onboarding content to top
  const scrollToTop = () => {
    const container = document.getElementById("onboarding-content");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Enhanced redirect logic - check if user already has organization
  useEffect(() => {
    if (redirectChecked) return;

    const hasExistingOrganization =
      !!currentOrganization || (organizations && organizations.length > 0);

    console.log("🔍 [ONBOARDING] Checking if user needs onboarding:", {
      hasOrganization: !!currentOrganization,
      hasMemberships: !!(organizations && organizations.length > 0),
      hasExistingOrganization,
    });

    if (hasExistingOrganization) {
      console.log(
        "✅ [ONBOARDING] User already has organization, redirecting to app"
      );

      // Get the organization ID
      const orgId = currentOrganization?.id || organizations?.[0]?.id;

      if (orgId) {
        router.push(`/app`);
      } else {
        router.push("/app");
      }
    }

    setRedirectChecked(true);
  }, [currentOrganization, organizations, router, redirectChecked]);

  // Don't render onboarding if user already has organizations
  if (currentOrganization || (organizations && organizations.length > 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Ya tienes una organización!
          </h2>
          <p className="text-gray-600">
            Redirigiendo a tu espacio de trabajo...
          </p>
        </div>
      </div>
    );
  }

  const goToNextStep = () => {
    const currentIndex = computedStepOrder.indexOf(currentStep);
    if (currentIndex < computedStepOrder.length - 1) {
      setCurrentStep(computedStepOrder[currentIndex + 1]);
      scrollToTop();
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = computedStepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(computedStepOrder[currentIndex - 1]);
      scrollToTop();
    }
  };

  const context: OnboardingContextType = {
    currentStep,
    selectedTheme,
    notificationSettings,
    setCurrentStep: (s) => {
      setCurrentStep(s);
      scrollToTop();
    },
    setSelectedTheme,
    setNotificationSettings,
    goToNextStep,
    goToPreviousStep,
    isCreatingOrganization,
    setIsCreatingOrganization,
    organizationData,
    setOrganizationData,
    availableSteps: computedStepOrder,
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return <WelcomeStep context={context} />;
      case OnboardingStep.THEME_SELECTION:
        return <ThemeSelectionStep context={context} />;
      case OnboardingStep.NOTIFICATIONS:
        return <NotificationStep context={context} />;
      case OnboardingStep.CREATE_ORGANIZATION:
        return <CreateOrganizationStep context={context} />;
      default:
        return <WelcomeStep context={context} />;
    }
  };

  const getProgress = () => {
    const currentIndex = computedStepOrder.indexOf(currentStep);
    return ((currentIndex + 1) / computedStepOrder.length) * 100;
  };

  // Show loading while checking organization status or plan
  // When there is no organization, rely on subscription instead of org plan
  const isPlanContextReady = (currentOrganization as { id?: string } | null)?.id
    ? !planLoading && !!planInfo
    : !subscriptionLoading; // do not require subscription to exist; we can default later

  if (!redirectChecked || !isPlanContextReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado y plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-white"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <OnboardingLayout context={context} progress={getProgress()}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </OnboardingLayout>
    </div>
  );
}
