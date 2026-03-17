"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";

// Deprecated: standalone organization creation is no longer used.
// Keep component as a thin redirect to pricing for non-super admins to avoid hard breaks if referenced.
export function CreateOrganizationClient() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  const subscriptionId = searchParams.get("subscription_id");
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Move all hooks to top-level before any early returns
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);

  console.log("🔍 CreateOrganizationClient params:", {
    redirectUrl,
    subscriptionId,
  });

  // Validate that user has a subscription before allowing organization creation
  useEffect(() => {
    const validateSubscription = async () => {
      try {
        const response = await fetch("/api/users/org-status");
        const data = await response.json();

        // Super admins can always create organizations without subscription
        if (data.isSuperAdmin) {
          console.log(
            "👑 [CREATE-ORG] Super admin detected, allowing organization creation"
          );
          setHasValidSubscription(true);
          setIsLoading(false);
          return;
        }

        // If user already has an organization, redirect to their dashboard
        if (data.hasOrganization && data.organizationId) {
          console.log(
            "🎯 [CREATE-ORG] User already has organization, redirecting to dashboard"
          );
          window.location.href = "/app/organization";
          return;
        }

        // If no subscription found and no subscription_id in URL, redirect to pricing
        // ✅ Fixed: Check hasActiveSubscription instead of pendingSubscription
        if (!data.hasActiveSubscription && !subscriptionId) {
          console.log(
            "🚨 [CREATE-ORG] No active subscription found, redirecting to app for subscription selection"
          );
          window.location.href = "/app";
          return;
        }

        // If we have a subscription or subscription_id, allow organization creation
        // ✅ Fixed: Check hasActiveSubscription instead of pendingSubscription
        if (data.hasActiveSubscription || subscriptionId) {
          setHasValidSubscription(true);
        }
      } catch (error) {
        console.error("❌ [CREATE-ORG] Error validating subscription:", error);
        // On error, redirect to app to be safe
        window.location.href = "/app";
      } finally {
        setIsLoading(false);
      }
    };

    validateSubscription();
  }, [subscriptionId]);

  // Show loading while validating subscription
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-gray-600">Validando suscripción...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no valid subscription
  if (!hasValidSubscription) {
    return null;
  }

  // Use the redirect URL if it exists and is an /app route, otherwise default to /app
  const afterCreateUrl = redirectUrl?.startsWith("/app") ? redirectUrl : "/app";

  const handleOrganizationCreated = async (organization: any) => {
    console.log("🏢 Organization created:", organization);

    // If we have a subscription ID, link it to the new organization
    if (subscriptionId) {
      try {
        console.log("🔗 Linking subscription to new organization:", {
          subscriptionId,
          organizationId: organization.id,
        });

        const linkResponse = await fetch(
          "/api/organization/link-subscription",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscriptionId,
              organizationId: organization.id,
            }),
          }
        );

        if (linkResponse.ok) {
          const linkData = await linkResponse.json();
          console.log("✅ Subscription linked successfully:", linkData);

          // Redirect to organization dashboard with success message
          window.location.href =
            "/app/organization?subscription_activated=true";
          return;
        } else {
          console.error("❌ Failed to link subscription");
        }
      } catch (error) {
        console.error("❌ Error linking subscription:", error);
      }
    }

    // Fallback: redirect to normal URL
    window.location.href = afterCreateUrl;
  };

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (res.ok) {
        const org = await res.json();
        await handleOrganizationCreated(org.organization);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <p className="text-gray-700">
          La creación de organizaciones se realiza al crear un cliente.
        </p>
        <Button color="primary" onPress={() => (window.location.href = "/app/superadmin")}>Abrir panel de Super Admin</Button>
      </div>
    </div>
  );
}
