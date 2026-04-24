"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Switch,
  Divider,
  Spinner,
  Tabs,
  Tab,
} from "@heroui/react";
// Icons now using Iconify CSS classes
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { usePlanPermissions } from "@/modules/core/hooks/usePlanPermissions";
import {
  PlanRestrictionBanner,
  FeatureRestrictionChip,
} from "../subscription/PlanRestrictionBanner";
import { PlanType } from "@/types/subscription.types";
import { PlanWidget } from "../subscription/PlanWidget";

export function OrganizationSettingsWithPlan() {
  const { currentOrganization } = useOrganization();
  const {
    planInfo,
    permissions,
    hasFeature,
    getRestrictionMessage,
    isLoading,
  } = usePlanPermissions();

  const [settings, setSettings] = useState({
    // Basic settings (available to all plans)
    name: "",
    description: "",
    website: "",

    // Logo customization (Starter+)
    logoUrl: "",

    // Color theme (Grow+)
    primaryColor: "#0066CC",
    secondaryColor: "#4A90E2",
    accentColor: "#E3F2FD",

    // Advanced customization (Grow Pro+)
    customCSS: "",
    customDomain: "",
    whiteLabel: false,

    // Premium features (Premium only)
    apiAccess: false,
    ssoEnabled: false,
    auditLogs: false,
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (currentOrganization) {
      // Load organization settings
      loadOrganizationSettings();
    }
  }, [currentOrganization]);

  const loadOrganizationSettings = async () => {
    try {
      const response = await fetch(
        `/api/organization/${currentOrganization?.id}/settings`
      );
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);

    try {
      const response = await fetch(
        `/api/organization/${currentOrganization?.id}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "FEATURE_RESTRICTED") {
          setErrors([
            errorData.restriction?.message ||
              "Feature not available in current plan",
          ]);
        } else {
          throw new Error(errorData.error || "Failed to save settings");
        }
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "An error occurred"]);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!planInfo || !permissions) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-gray-500">
            Unable to load plan information
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Plan Widget */}
      <div className="lg:hidden">
        <PlanWidget />
      </div>

      {/* Plan Restriction Banners */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Plan Widget */}
        <div className="hidden lg:block">
          <PlanWidget />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs aria-label="Organization Settings">
            {/* Basic Settings Tab */}
            <Tab key="basic" title="Basic Settings">
              <Card>
                <CardHeader className="flex gap-3">
                  <i className="icon-[lucide--settings] w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <p className="text-sm text-gray-600">
                      Basic organization settings available to all plans
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input
                    label="Organization Name"
                    value={settings.name}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter organization name"
                  />

                  <Input
                    label="Description"
                    value={settings.description}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your organization"
                  />

                  <Input
                    label="Website"
                    value={settings.website}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                  />

                  <Button
                    color="primary"
                    onClick={handleSave}
                    isLoading={saving}
                  >
                    Save Basic Settings
                  </Button>
                </CardBody>
              </Card>
            </Tab>

            {/* Logo Customization Tab */}
            <Tab
              key="branding"
              title={
                <div className="flex items-center gap-2">
                  <span>Branding</span>
                  {!hasFeature("canCustomizeLogo") && (
                    <FeatureRestrictionChip requiredPlan={PlanType.STARTER} />
                  )}
                </div>
              }
            >
              <Card>
                <CardHeader className="flex gap-3">
                  <i className="icon-[lucide--image] w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Logo & Branding</h3>
                    <p className="text-sm text-gray-600">
                      Customize your organization's visual identity
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  {hasFeature("canCustomizeLogo") ? (
                    <div className="space-y-4">
                      <Input
                        label="Logo URL"
                        value={settings.logoUrl}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            logoUrl: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/logo.png"
                        description="Upload your logo and paste the URL here"
                      />

                      {settings.logoUrl ? (
                        <div className="rounded-lg bg-gray-50 p-4">
                          <p className="mb-2 text-sm text-gray-600">
                            Vista previa del logo
                          </p>
                          <div className="relative h-16 w-40 overflow-hidden rounded-md border border-gray-200 bg-white">
                            <Image
                              src={settings.logoUrl}
                              alt="Vista previa del logo de la organización"
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          </div>
                        </div>
                      ) : null}

                      <Button
                        color="primary"
                        onClick={handleSave}
                        isLoading={saving}
                      >
                        Save Logo Settings
                      </Button>
                    </div>
                  ) : (
                    <PlanRestrictionBanner
                      restriction={getRestrictionMessage("canCustomizeLogo")!}
                      currentPlan={planInfo.planType}
                      featureName="Logo Customization"
                      variant="inline"
                    />
                  )}
                </CardBody>
              </Card>
            </Tab>

            {/* Color Theme Tab */}
            <Tab
              key="theme"
              title={
                <div className="flex items-center gap-2">
                  <span>Theme</span>
                  {!hasFeature("canCustomizeColors") && (
                    <FeatureRestrictionChip requiredPlan={PlanType.GROW} />
                  )}
                </div>
              }
            >
              <Card>
                <CardHeader className="flex gap-3">
                  <i className="icon-[lucide--palette] w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Color Theme</h3>
                    <p className="text-sm text-gray-600">
                      Customize your platform's color scheme
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  {hasFeature("canCustomizeColors") ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="primaryColor"
                            className="block text-sm font-medium mb-2"
                          >
                            Primary Color
                          </label>
                          <input
                            id="primaryColor"
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                primaryColor: e.target.value,
                              }))
                            }
                            className="w-full h-10 rounded border"
                            title="Select primary color"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="secondaryColor"
                            className="block text-sm font-medium mb-2"
                          >
                            Secondary Color
                          </label>
                          <input
                            id="secondaryColor"
                            type="color"
                            value={settings.secondaryColor}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                secondaryColor: e.target.value,
                              }))
                            }
                            className="w-full h-10 rounded border"
                            title="Select secondary color"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="accentColor"
                            className="block text-sm font-medium mb-2"
                          >
                            Accent Color
                          </label>
                          <input
                            id="accentColor"
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                accentColor: e.target.value,
                              }))
                            }
                            className="w-full h-10 rounded border"
                            title="Select accent color"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          Theme Preview:
                        </p>
                        <div className="flex gap-2">
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: settings.primaryColor }}
                          />
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: settings.secondaryColor }}
                          />
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: settings.accentColor }}
                          />
                        </div>
                      </div>

                      <Button
                        color="primary"
                        onClick={handleSave}
                        isLoading={saving}
                      >
                        Save Theme Settings
                      </Button>
                    </div>
                  ) : (
                    <PlanRestrictionBanner
                      restriction={getRestrictionMessage("canCustomizeColors")!}
                      currentPlan={planInfo.planType}
                      featureName="Color Theme Customization"
                      variant="inline"
                    />
                  )}
                </CardBody>
              </Card>
            </Tab>

            {/* Advanced Customization Tab */}
            <Tab
              key="advanced"
              title={
                <div className="flex items-center gap-2">
                  <span>Advanced</span>
                  {!hasFeature("canAccessUnlimitedCustomization") && (
                    <FeatureRestrictionChip requiredPlan={PlanType.GROW_PRO} />
                  )}
                </div>
              }
            >
              <Card>
                <CardHeader className="flex gap-3">
                  <i className="icon-[lucide--globe] w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      Advanced Customization
                    </h3>
                    <p className="text-sm text-gray-600">
                      Advanced branding and customization options
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  {hasFeature("canAccessUnlimitedCustomization") ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Custom CSS
                        </label>
                        <textarea
                          value={settings.customCSS}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              customCSS: e.target.value,
                            }))
                          }
                          placeholder="/* Add your custom CSS here */"
                          className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Add custom CSS to further customize your platform
                          appearance
                        </p>
                      </div>

                      <Input
                        label="Custom Domain"
                        value={settings.customDomain}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            customDomain: e.target.value,
                          }))
                        }
                        placeholder="reports.yourcompany.com"
                        description="Use your own domain for the reporting portal"
                      />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">White Label Mode</h4>
                          <p className="text-sm text-gray-600">
                            Remove EthicVoice branding from your portal
                          </p>
                        </div>
                        <Switch
                          isSelected={settings.whiteLabel}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              whiteLabel: value,
                            }))
                          }
                        />
                      </div>

                      <Button
                        color="primary"
                        onClick={handleSave}
                        isLoading={saving}
                      >
                        Save Advanced Settings
                      </Button>
                    </div>
                  ) : (
                    <PlanRestrictionBanner
                      restriction={
                        getRestrictionMessage(
                          "canAccessUnlimitedCustomization"
                        )!
                      }
                      currentPlan={planInfo.planType}
                      featureName="Advanced Customization"
                      variant="inline"
                    />
                  )}
                </CardBody>
              </Card>
            </Tab>

            {/* Premium Features Tab */}
            <Tab
              key="premium"
              title={
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--crown] w-4 h-4" />
                  <span>Premium</span>
                  {planInfo.planType !== "PREMIUM" && (
                    <FeatureRestrictionChip requiredPlan={PlanType.PREMIUM} />
                  )}
                </div>
              }
            >
              <Card>
                <CardHeader className="flex gap-3">
                  <i className="icon-[lucide--shield] w-5 h-5" />
                  <div>
                    <h3 className="text-lg font-semibold">Premium Features</h3>
                    <p className="text-sm text-gray-600">
                      Enterprise-grade features and integrations
                    </p>
                  </div>
                </CardHeader>
                <CardBody>
                  {planInfo.planType === "PREMIUM" ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">API Access</h4>
                          <p className="text-sm text-gray-600">
                            Enable REST API access for custom integrations
                          </p>
                        </div>
                        <Switch
                          isSelected={settings.apiAccess}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              apiAccess: value,
                            }))
                          }
                        />
                      </div>

                      <Divider />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Single Sign-On (SSO)</h4>
                          <p className="text-sm text-gray-600">
                            Enable SAML/OAuth SSO integration
                          </p>
                        </div>
                        <Switch
                          isSelected={settings.ssoEnabled}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              ssoEnabled: value,
                            }))
                          }
                        />
                      </div>

                      <Divider />

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Advanced Audit Logs</h4>
                          <p className="text-sm text-gray-600">
                            Detailed audit logging for compliance
                          </p>
                        </div>
                        <Switch
                          isSelected={settings.auditLogs}
                          onValueChange={(value) =>
                            setSettings((prev) => ({
                              ...prev,
                              auditLogs: value,
                            }))
                          }
                        />
                      </div>

                      <Button
                        color="primary"
                        onClick={handleSave}
                        isLoading={saving}
                        className="w-full"
                      >
                        Save Premium Settings
                      </Button>
                    </div>
                  ) : (
                    <PlanRestrictionBanner
                      restriction={{
                        reason: "PLAN_UPGRADE_REQUIRED" as any,
                        message:
                          "Premium features require the Premium plan with enterprise-grade capabilities.",
                        requiredPlan: PlanType.PREMIUM,
                        upgradeUrl: planInfo.upgradeUrl,
                      }}
                      currentPlan={planInfo.planType}
                      featureName="Premium Features"
                      variant="inline"
                    />
                  )}
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
