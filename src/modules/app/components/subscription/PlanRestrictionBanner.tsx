"use client";

import React from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
// Icons now using Iconify CSS classes
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { PlanType } from "@/types/subscription.types";
import type {
  PlanRestriction as AppPlanRestriction,
  PlanRestrictionReason as AppRestrictionReason,
} from "@/types/auth.types";

export interface PlanRestrictionReason {
  type:
    | "upgrade_required"
    | "limit_exceeded"
    | "subscription_inactive"
    | "feature_disabled";
  planRequired?: PlanType | string;
  currentLimit?: number;
  usageCount?: number;
  message?: string;
  upgradeUrl?: string;
}

interface PlanRestrictionBannerProps {
  // Preferred prop
  reason?: PlanRestrictionReason;
  // Back-compat prop used across the app
  restriction?: AppPlanRestriction;
  currentPlan?: PlanType;
  featureName: string;
  onDismiss?: () => void;
  className?: string;
  variant?: "inline" | "modal" | "banner";
}

export function PlanRestrictionBanner({
  reason: reasonProp,
  restriction,
  currentPlan: _currentPlan,
  featureName,
  onDismiss,
  className = "",
  variant = "banner",
}: PlanRestrictionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Normalize legacy restriction object to local reason type
  const reason: PlanRestrictionReason = reasonProp
    ? reasonProp
    : ((): PlanRestrictionReason => {
        if (!restriction) {
          return { type: "upgrade_required", message: "Feature restricted" };
        }
        switch (restriction.reason as AppRestrictionReason) {
          case "PLAN_UPGRADE_REQUIRED":
            return {
              type: "upgrade_required",
              planRequired: restriction.requiredPlan,
              message: restriction.message,
              upgradeUrl: restriction.upgradeUrl,
            };
          case "SUBSCRIPTION_INACTIVE":
            return {
              type: "subscription_inactive",
              message: restriction.message,
              upgradeUrl: restriction.upgradeUrl,
            };
          case "USER_LIMIT_EXCEEDED":
          case "INVESTIGATOR_LIMIT_EXCEEDED":
            return {
              type: "limit_exceeded",
              message: restriction.message,
              usageCount:
                restriction.currentUsage && restriction.limit
                  ? (restriction.currentUsage / restriction.limit) * 100
                  : undefined,
              upgradeUrl: restriction.upgradeUrl,
            };
          case "FEATURE_NOT_AVAILABLE":
          default:
            return {
              type: "feature_disabled",
              message: restriction.message,
              upgradeUrl: restriction.upgradeUrl,
            };
        }
      })();

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const getRestrictionIcon = () => {
    switch (reason.type) {
      case "upgrade_required":
        return <i className="icon-[lucide--crown] w-5 h-5" />;
      case "subscription_inactive":
        return <i className="icon-[lucide--alert-triangle] w-5 h-5" />;
      case "limit_exceeded":
        return <i className="icon-[lucide--users] w-5 h-5" />;
      case "feature_disabled":
        return <i className="icon-[lucide--zap] w-5 h-5" />;
      default:
        return <i className="icon-[lucide--alert-triangle] w-5 h-5" />;
    }
  };

  const getColorScheme = () => {
    switch (reason.type) {
      case "upgrade_required":
        return {
          bg: "bg-purple-50 border-purple-200",
          text: "text-purple-800",
          icon: "text-purple-600",
          button: "primary",
        };
      case "subscription_inactive":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-800",
          icon: "text-red-600",
          button: "danger",
        };
      case "limit_exceeded":
        return {
          bg: "bg-orange-50 border-orange-200",
          text: "text-orange-800",
          icon: "text-orange-600",
          button: "warning",
        };
      case "feature_disabled":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-800",
          icon: "text-blue-600",
          button: "primary",
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200",
          text: "text-gray-800",
          icon: "text-gray-600",
          button: "default",
        };
    }
  };

  const getButtonText = () => {
    switch (reason.type) {
      case "upgrade_required":
        return `Upgrade to ${reason.planRequired}`;
      case "subscription_inactive":
        return "Reactivate Subscription";
      case "limit_exceeded":
        return "Increase Limits";
      case "feature_disabled":
        return "Enable Feature";
      default:
        return "Learn More";
    }
  };

  const colors = getColorScheme();

  if (isDismissed) return null;

  const content = (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
        {getRestrictionIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className={`font-medium text-sm ${colors.text} mb-1`}>
              {featureName} Restricted
            </h4>
            <p className={`text-sm ${colors.text} opacity-90 mb-3`}>
              {reason.message}
            </p>

            {reason.usageCount !== undefined && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Usage</span>
                  <span>{Math.round(reason.usageCount)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-current h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(reason.usageCount, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                as={Link}
                href={reason.upgradeUrl}
                color={colors.button as any}
                size="sm"
                endContent={<i className="icon-[mdi--arrow-right] w-3 h-3" />}
              >
                {getButtonText()}
              </Button>

              <Chip size="sm" variant="flat" color={colors.button as any}>
                {reason.planRequired} Plan Required
              </Chip>
            </div>
          </div>

          {onDismiss && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onClick={handleDismiss}
              aria-label="Dismiss plan restriction notice"
              title="Dismiss"
            >
              <i className="icon-[lucide--x] w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`p-4 rounded-lg border ${colors.bg} ${className}`}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === "modal") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <Card className="w-full max-w-md">
            <CardBody className="p-6">{content}</CardBody>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default banner variant
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-4 rounded-lg border ${colors.bg} ${className}`}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
}

// Helper component for small restriction chips
export function FeatureRestrictionChip({
  requiredPlan,
  className = "",
}: {
  requiredPlan: PlanType;
  className?: string;
}) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color="warning"
      startContent={<i className="icon-[lucide--crown] w-3 h-3" />}
      className={className}
    >
      {requiredPlan}+ Required
    </Chip>
  );
}

// Helper component to wrap disabled features
export function DisabledFeatureWrapper({
  children,
  restriction,
  currentPlan,
  featureName,
  className = "",
}: {
  children: React.ReactNode;
  restriction: PlanRestrictionReason;
  currentPlan: PlanType;
  featureName: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
        <div className="text-center p-4">
          <i className="icon-[lucide--lock] w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">{featureName} Locked</p>
          <Button
            as={Link}
            href={restriction.upgradeUrl}
            size="sm"
            color="primary"
            endContent={<i className="icon-[mdi--arrow-right] w-3 h-3" />}
          >
            Upgrade to Unlock
          </Button>
        </div>
      </div>
    </div>
  );
}
