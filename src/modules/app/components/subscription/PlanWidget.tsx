"use client";

import React from "react";
import { Card, CardBody, Button, Progress, Chip } from "@heroui/react";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import Link from "next/link";

export function PlanWidget() {
  const { planInfo, usageWarnings, showTrialWarning } = usePlanPermissions();

  if (!planInfo) {
    return null;
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "STARTER":
        return <i className="icon-[lucide--rocket] w-5 h-5 text-blue-500" />;
      case "GROW":
        return <i className="icon-[lucide--target] w-5 h-5 text-green-500" />;
      case "GROW_PRO":
        return <i className="icon-[lucide--star] w-5 h-5 text-purple-500" />;
      case "PREMIUM":
        return <i className="icon-[lucide--crown] w-5 h-5 text-yellow-500" />;
      default:
        return <i className="icon-[lucide--package] w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "STARTER":
        return "primary";
      case "GROW":
        return "success";
      case "GROW_PRO":
        return "secondary";
      case "PREMIUM":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getPlanIcon(planInfo.planType)}
          </div>
          <div>
            <h3 className="font-bold text-lg">{planInfo.planName}</h3>
            <div className="flex items-center gap-2">
              <Chip
                size="sm"
                color={
                  getPlanColor(planInfo.planType) as
                    | "default"
                    | "primary"
                    | "secondary"
                    | "success"
                    | "warning"
                    | "danger"
                }
                variant="flat"
              >
                {planInfo.planType}
              </Chip>
              {planInfo.isTrialActive && (
                <Chip size="sm" color="warning" variant="flat">
                  Trial
                </Chip>
              )}
            </div>
          </div>
        </div>

        {/* Trial Warning */}
        {showTrialWarning && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700 text-sm mb-1">
              <i className="icon-[lucide--clock] w-4 h-4" />
              <span className="font-medium">Trial Ending Soon</span>
            </div>
            <p className="text-orange-600 text-xs">
              Your trial ends in {planInfo.trialDaysRemaining} days. Upgrade to
              continue using all features.
            </p>
          </div>
        )}

        {/* Usage Metrics */}
        {(planInfo.currentUsers > 0 || planInfo.currentInvestigators > 0) && (
          <div className="space-y-3 mb-4">
            {planInfo.maxUsers > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1">
                    <i className="icon-[lucide--users] w-3 h-3" />
                    Users
                  </span>
                  <span className="font-medium">
                    {planInfo.currentUsers}/{planInfo.maxUsers}
                  </span>
                </div>
                <Progress
                  size="sm"
                  value={(planInfo.currentUsers / planInfo.maxUsers) * 100}
                  color={
                    planInfo.currentUsers >= planInfo.maxUsers
                      ? "danger"
                      : "primary"
                  }
                />
              </div>
            )}

            {planInfo.maxUsers === -1 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Usuarios:</span> {planInfo.currentUsers}/∞
              </div>
            )}

            {planInfo.maxInvestigators > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1">
                    <i className="icon-[lucide--user-check] w-3 h-3" />
                    Investigators
                  </span>
                  <span className="font-medium">
                    {planInfo.currentInvestigators}/{planInfo.maxInvestigators}
                  </span>
                </div>
                <Progress
                  size="sm"
                  value={
                    (planInfo.currentInvestigators /
                      planInfo.maxInvestigators) *
                    100
                  }
                  color={
                    planInfo.currentInvestigators >= planInfo.maxInvestigators
                      ? "danger"
                      : "primary"
                  }
                />
              </div>
            )}

            {planInfo.maxInvestigators === -1 && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Investigadores:</span>{" "}
                {planInfo.currentInvestigators}/∞
              </div>
            )}
          </div>
        )}

        {/* Usage Warnings */}
        {usageWarnings.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <i className="icon-[lucide--alert-triangle] w-4 h-4" />
              Attention Required
            </h4>
            {usageWarnings.map((warning, index) => (
              <div
                key={index}
                className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200"
              >
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button
          as={Link}
          href={planInfo.upgradeUrl}
          color="primary"
          className="w-full"
          endContent={<i className="icon-[mdi--arrow-right] w-4 h-4" />}
        >
          {planInfo.planType === "PREMIUM" ? "Contact Support" : "Upgrade Plan"}
        </Button>

        {/* Plan Details Link */}
        <div className="mt-3 text-center">
          <Button
            as={Link}
            href="/pricing"
            variant="light"
            size="sm"
            className="text-xs text-gray-500"
          >
            Compare all plans
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
