"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { Spinner, Button, Card, CardBody, CardHeader } from "@heroui/react";
import dynamic from "next/dynamic";
import { useAuth, useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";

// Dynamically import the pricing component to avoid SSR issues
const InPlatformPricingModal = dynamic(
  () => import("@/modules/app/components/subscription/InPlatformPricingModal"),
  { ssr: false }
);

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isLoaded, user } = useUser();
  const { organizations } = useOrganization();
  const { orgId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [redirectAttempts] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failed"
  >("idle");
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [showVerificationOverlay, setShowVerificationOverlay] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<
    "loading" | "success" | "pending" | "failed"
  >("loading");
  const [overlayMessage, setOverlayMessage] = useState<string>("");
  const [overlaySubscriptionId, setOverlaySubscriptionId] = useState<string | null>(null);
  const [overlayPlanName, setOverlayPlanName] = useState<string>("");
  const { signOut } = useClerk();

  // Hosted checkout return: handle verification in an overlay to block the UI
  useEffect(() => {
    const preapprovalId = searchParams.get("preapproval_id");
    if (!preapprovalId) return;
    // Open overlay and verify
    if (paymentVerificationStatus === "idle") {
      setShowVerificationOverlay(true);
      setOverlayStatus("loading");
      setPaymentVerificationStatus("verifying");

      const verify = async () => {
        try {
          const resp = await fetch(`/api/subscriptions/verify?preapproval_id=${encodeURIComponent(preapprovalId)}`);
          const data = await resp.json();
          if (resp.ok && data) {
            const normalized =
              data.status === "ACTIVE"
                ? "success"
                : data.status === "PAST_DUE"
                ? "pending"
                : data.status === "CANCELED"
                ? "failed"
                : "pending";
            setOverlayStatus(normalized);
            setOverlayMessage(data.message || "");
            if (data.subscription?.id) setOverlaySubscriptionId(String(data.subscription.id));
            if (data.subscription?.planType || data.planName) setOverlayPlanName(data.subscription?.planType || data.planName);
            setPaymentVerificationStatus(normalized === "failed" ? "failed" : "success");
            // Clean up the URL so overlay won't reappear on future navigations
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("preapproval_id");
            window.history.replaceState({}, "", cleanUrl.toString());
          } else {
            setOverlayStatus("failed");
            setOverlayMessage(data?.error || "No pudimos verificar tu pago.");
            setPaymentVerificationStatus("failed");
            // Also clean up the URL on failure
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("preapproval_id");
            window.history.replaceState({}, "", cleanUrl.toString());
          }
        } catch (e) {
          setOverlayStatus("failed");
          setOverlayMessage("Ocurrió un error al verificar tu pago.");
          setPaymentVerificationStatus("failed");
          // Clean up the URL on error as well
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("preapproval_id");
          window.history.replaceState({}, "", cleanUrl.toString());
        }
      };
      verify();
    }
  }, [searchParams, paymentVerificationStatus]);

  // Ensure overlay is never shown if there's no preapproval param on the URL
  useEffect(() => {
    const hasPreapproval = !!searchParams.get("preapproval_id");
    const isPaymentSuccessRoute = pathname.includes("/onboarding/payment-success");
    if (!hasPreapproval && !isPaymentSuccessRoute) {
      if (showVerificationOverlay || paymentVerificationStatus !== "idle") {
        setShowVerificationOverlay(false);
        setPaymentVerificationStatus("idle");
        setOverlayStatus("loading");
        setOverlayMessage("");
        setOverlayPlanName("");
        setOverlaySubscriptionId(null);
      }
    }
  }, [pathname, searchParams, showVerificationOverlay, paymentVerificationStatus]);

  // Handle payment verification if legacy payment parameters are present
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const subscriptionId = searchParams.get("subscription_id");

    if (
      paymentStatus &&
      subscriptionId &&
      paymentVerificationStatus === "idle"
    ) {
      setPaymentVerificationStatus("verifying");

      const verifyPayment = async () => {
        try {
          console.log("🔍 [SUBSCRIPTION-GUARD] Verifying payment:", {
            paymentStatus,
            subscriptionId,
          });

          const params = new URLSearchParams();
          params.set("subscription_id", subscriptionId);
          params.set("status", paymentStatus);

          const response = await fetch(
            `/api/payments/verify-subscription?${params.toString()}`
          );
          const data = await response.json();

          if (response.ok && data.success) {
            console.log(
              "✅ [SUBSCRIPTION-GUARD] Payment verification successful"
            );
            setPaymentVerificationStatus("success");

            // Update user completion status to ensure proper onboarding flow
            if (data.status === "success") {
              try {
                await fetch("/api/users/org-status", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ hasCompletedOrgSetup: false }),
                });
                console.log(
                  "✅ [SUBSCRIPTION-GUARD] User completion status updated"
                );
              } catch (orgError) {
                console.warn(
                  "⚠️ [SUBSCRIPTION-GUARD] Could not update user status:",
                  orgError
                );
              }
            }

            // Clean up URL parameters
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("payment");
            cleanUrl.searchParams.delete("subscription_id");
            window.history.replaceState({}, "", cleanUrl.toString());
          } else {
            console.error(
              "❌ [SUBSCRIPTION-GUARD] Payment verification failed:",
              data.error
            );
            setPaymentVerificationStatus("failed");
          }
        } catch (error) {
          console.error(
            "❌ [SUBSCRIPTION-GUARD] Payment verification error:",
            error
          );
          setPaymentVerificationStatus("failed");
        }
      };

      verifyPayment();
    }
  }, [searchParams, paymentVerificationStatus]);

  useEffect(() => {
    if (!isLoaded || !user) {
      setIsCheckingSubscription(true);
      return;
    }

    // Silent background check for subscription requirements
    const performSilentCheck = async () => {
      // Prevent too many redirects
      if (redirectAttempts >= 2) {
        setIsCheckingSubscription(false);
        return;
      }

      // Throttle checks
      const now = Date.now();
      if (now - lastCheckTime < 5000) {
        setIsCheckingSubscription(false);
        return;
      }
      setLastCheckTime(now);

      try {
        // Quick API check without blocking UI
        const response = await fetch("/api/users/org-status", {
          cache: "no-cache",
        });

        if (response.ok) {
          const data = await response.json();

          // ✅ Enhanced debugging for subscription status
          console.log("🔍 [SUBSCRIPTION-GUARD] User status check result:", {
            hasActiveSubscription: data.hasActiveSubscription,
            hasOrganization: data.hasOrganization,
            organizationId: data.organizationId,
            isAdmin: data.isAdmin,
            isSuperAdmin: data.isSuperAdmin,
            userMembershipsCount: organizations?.length || 0,
            paymentVerificationStatus,
          });

          // Show access deactivated screen if org/user is inactive due to cancellation expiry
          if (data?.orgIsActive === false) {
            setShowPricingModal(true);
            setIsCheckingSubscription(false);
            return;
          }

          // ✅ PRIORITY 1: Super admin bypass - they don't need subscriptions
          if (data.isSuperAdmin) {
            console.log(
              "👑 [SUBSCRIPTION-GUARD] Super admin detected, bypassing subscription requirements"
            );
            setShowPricingModal(false);
            setIsCheckingSubscription(false);

            // Let super admins continue to their intended route (no automatic redirect)
            return;
          }

          // PRIORITY 2: Check subscription requirements for regular users only
          // No subscription, no org - show pricing modal only (but not if we're verifying payment)
          if (
            !data.hasActiveSubscription &&
            !data.hasOrganization &&
            (!organizations || organizations.length === 0) &&
            paymentVerificationStatus === "idle" &&
            !searchParams.get("preapproval_id") &&
            !pathname.includes("/onboarding/payment-success")
          ) {
            console.log(
              "💳 [SUBSCRIPTION-GUARD] No active subscription found, showing pricing modal"
            );
            setShowPricingModal(true);
            setIsCheckingSubscription(false);
            return;
          }

          // ✅ Added: Safeguard - if user has active subscription, never show pricing modal
          if (data.hasActiveSubscription) {
            console.log(
              "✅ [SUBSCRIPTION-GUARD] User has active subscription, allowing access"
            );
            setShowPricingModal(false);
            setIsCheckingSubscription(false);
            return;
          }

          // Default: allow access if checks pass
          setIsCheckingSubscription(false);
        } else {
          console.warn(
            "⚠️ [SUBSCRIPTION-GUARD] API check failed, allowing access"
          );
          setIsCheckingSubscription(false);
        }
      } catch (error) {
        console.warn("⚠️ [SUBSCRIPTION-GUARD] Silent check failed:", error);
        setIsCheckingSubscription(false);
      }
    };

    // Run check once, silently
    const timeoutId = setTimeout(performSilentCheck, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    isLoaded,
    user,
    organizations,
    router,
    redirectAttempts,
    lastCheckTime,
    paymentVerificationStatus,
  ]);

  // Show loading during initial auth check
  if (!isLoaded || !user || isCheckingSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-gray-600">
            {isCheckingSubscription ? "Verificando suscripción..." : "Cargando..."}
          </p>
        </div>
      </div>
    );
  }

  // Show pricing modal when subscription is required
  if (showPricingModal) {
    return (
      <div className="min-h-screen bg-gray-50 relative">
        <InPlatformPricingModal
          isOpen={showPricingModal}
          onClose={() => {
            console.log(
              "🚫 [SUBSCRIPTION-GUARD] Modal close prevented - subscription required"
            );
          }}
          onSubscriptionCreated={(subscriptionId: number) => {
            console.log(
              "✅ [SUBSCRIPTION-GUARD] Subscription created:",
              subscriptionId
            );
            setShowPricingModal(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Allow access, but if verification overlay is active, block interactions visually
  const Overlay = () => (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-xl">
        <Card className={`border-2 ${overlayStatus === "success" ? "bg-green-50 border-green-200" : overlayStatus === "pending" ? "bg-orange-50 border-orange-200" : overlayStatus === "failed" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <CardHeader className="text-center pb-3 flex flex-col items-center">
            <div className="mb-3">
              <i className={`${overlayStatus === "success" ? "icon-[lucide--check-circle] text-green-600" : overlayStatus === "pending" ? "icon-[lucide--clock] text-orange-600" : overlayStatus === "failed" ? "icon-[lucide--x-circle] text-red-600" : "icon-[lucide--loader-2] text-blue-600"} w-14 h-14 ${overlayStatus === "loading" ? "animate-spin" : ""}`} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {overlayStatus === "success" && "¡Pago exitoso!"}
              {overlayStatus === "pending" && "Procesando pago"}
              {overlayStatus === "failed" && "Pago fallido"}
              {overlayStatus === "loading" && "Verificando pago..."}
            </h1>
          </CardHeader>
          <CardBody className="text-center flex flex-col items-center">
            <p className="text-gray-700 mb-4 max-w-md">
              {overlayMessage || (overlayStatus === "success"
                ? `¡Genial! Tu suscripción ${overlayPlanName} ya está activa. Continúa para completar el onboarding.`
                : overlayStatus === "pending"
                ? `Estamos procesando tu pago. Te llevaremos al onboarding para continuar.`
                : overlayStatus === "failed"
                ? "No pudimos verificar tu pago. Por seguridad, debes cerrar sesión."
                : "Por favor espera mientras verificamos tu pago.")}
            </p>
            {overlaySubscriptionId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-5">
                <p className="text-sm text-gray-600">
                  <strong>ID de suscripción:</strong> {overlaySubscriptionId}
                </p>
                {overlayPlanName && (
                  <p className="text-sm text-gray-600">
                    <strong>Plan:</strong> {overlayPlanName}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {overlayStatus === "failed" ? (
                <Button color="danger" onClick={() => signOut()}>Cerrar sesión</Button>
              ) : (
                <Button color="primary" onClick={() => router.push("/app/onboarding")}>Ir al onboarding</Button>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );

  return (
    <>
      {children}
      {showVerificationOverlay && searchParams.get("preapproval_id") && <Overlay />}
    </>
  );
}
