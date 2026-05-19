"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
// Icons now using Iconify CSS classes
import { motion } from "framer-motion";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "failed"
  >("loading");
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [message, setMessage] = useState<string>("");

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const collectionStatus = searchParams.get("collection_status");
    const subId = searchParams.get("subscription_id");
    const paymentId = searchParams.get("payment_id");
    const preapprovalId = searchParams.get("preapproval_id");
    const preferenceId = searchParams.get("preference_id");
    const externalRef = searchParams.get("external_reference");

    console.log("🔍 Payment Success page loaded with params:", {
      paymentStatus,
      subId,
      paymentId,
    });

    if (subId) setSubscriptionId(subId);

    // Guard: if user clicked "Volver al sitio" from a one-time preference (e.g., proration), MP may
    // redirect with null params and only preference_id/external_reference. Do not treat as success.
    const isNullish = (v: string | null) =>
      v == null || v === "null" || v === "undefined";
    const looksLikeBackFromPreference =
      Boolean(preferenceId) &&
      isNullish(paymentId) &&
      isNullish(preapprovalId) &&
      isNullish(paymentStatus) &&
      isNullish(collectionStatus);
    const isProrationPreference = (externalRef || "").includes("proration");
    if (looksLikeBackFromPreference) {
      setStatus("failed");
      setMessage(
        isProrationPreference
          ? "Parece que cancelaste o volviste sin completar el cobro de prorrateo. No se realizó ningún cargo."
          : "Parece que cancelaste o volviste sin completar el pago. No se realizó ningún cargo.",
      );
      setPlanName("");
      return; // Avoid calling verification API
    }

    // Multiple verification strategies with retry logic
    const verifyPaymentWithRetry = async (attempt = 0) => {
      try {
        console.log(
          `🔄 Payment verification attempt ${attempt + 1}/${MAX_RETRIES + 1}`,
        );

        // Prefer Mercado Pago verification when preapproval_id is present
        const response = preapprovalId
          ? await fetch(
              `/api/subscriptions/verify?preapproval_id=${encodeURIComponent(preapprovalId)}`,
            )
          : await fetch(`/api/subscriptions/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscriptionId: subId || undefined,
                paymentId: paymentId || undefined,
              }),
            });
        const data = await response.json();

        console.log("📋 Verification response:", data);

        if (response.ok && data.success) {
          const normalizedStatus =
            data.status === "ACTIVE"
              ? "success"
              : data.status === "PAST_DUE"
                ? "pending"
                : data.status === "CANCELED"
                  ? "failed"
                  : "pending";
          setStatus(normalizedStatus);
          setPlanName(data.subscription?.planType || data.planName || "");
          if (!subId && data.subscription?.id) {
            setSubscriptionId(String(data.subscription.id));
          }
          setMessage(data.message || "");

          // If successful, update user completion status
          if (normalizedStatus === "success") {
            try {
              await fetch("/api/users/org-status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hasCompletedOrgSetup: false }),
              });
              console.log("✅ User completion status updated");
            } catch (orgError) {
              console.warn("⚠️ Could not update user status:", orgError);
              // Non-critical error, don't fail the whole process
            }
          }

          console.log("✅ Payment verification completed successfully");
          return;
        } else {
          throw new Error(data.error || "Verification failed");
        }
      } catch (error) {
        console.error(`❌ Verification attempt ${attempt + 1} failed:`, error);

        // If we haven't reached max retries, try again
        if (attempt < MAX_RETRIES) {
          console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
          setTimeout(() => {
            setRetryCount(attempt + 1);
            verifyPaymentWithRetry(attempt + 1);
          }, RETRY_DELAY);
          return;
        }

        // All retries exhausted - determine final status
        console.error("💥 All verification attempts failed");

        // Fallback strategy: Use URL parameters to determine status
        if (paymentStatus === "approved") {
          console.log("🔄 Using URL status as final fallback: success");
          setStatus("success");
          setMessage(
            "Payment appears successful. If you experience issues, contact support.",
          );
          setPlanName("Subscription Plan");
        } else if (paymentStatus === "pending") {
          console.log("🔄 Using URL status as final fallback: pending");
          setStatus("pending");
          setMessage("Payment is being processed. You can proceed with setup.");
          setPlanName("Subscription Plan");
        } else {
          console.log("🔄 Using URL status as final fallback: failed");
          setStatus("failed");
          setMessage(
            "We couldn't verify your payment. Please contact support if the issue persists.",
          );
        }
      }
    };

    // Start verification process
    verifyPaymentWithRetry();
  }, [searchParams, retryCount]);

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: "icon-[lucide--check-circle]",
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
          title: "¡Pago exitoso! 🎉",
          description:
            message ||
            `¡Genial! Tu suscripción ${planName} ya está activa. Ahora puedes continuar para crear tu organización y empezar a usar todas las funciones incluidas en tu plan.`,
        };
      case "pending":
        return {
          icon: "icon-[lucide--clock]",
          color: "text-orange-600",
          bgColor: "bg-orange-50 border-orange-200",
          title: "Procesando pago",
          description:
            message ||
            `Estamos procesando tu pago. Puedes continuar con la creación de tu organización y activaremos tu plan ${planName} en cuanto el pago sea confirmado.`,
        };
      case "failed":
        return {
          icon: "icon-[lucide--x-circle]",
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          title: "Pago fallido",
          description:
            message ||
            "No pudimos procesar tu pago. Intenta nuevamente o contacta a soporte si el problema persiste.",
        };
      default:
        return {
          icon: "icon-[lucide--loader-2]",
          color: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          title: "Verificando pago...",
          description:
            retryCount > 0
              ? `Intento de verificación ${retryCount + 1}/${MAX_RETRIES + 1}...`
              : "Por favor espera mientras verificamos el estado de tu pago.",
        };
    }
  };

  const handleContinue = async () => {
    if (status === "success" || status === "pending") {
      router.push("/app/onboarding");
      return;
    }
    // Pago fallido: redirigir según tenga organización o no
    try {
      const res = await fetch("/api/users/org-status", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.hasOrganization) {
        router.push("/app/organization");
      } else {
        router.push("/pricing");
      }
    } catch {
      router.push("/pricing");
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Payment Verification Issue");
    const body =
      encodeURIComponent(`Hello, I need help with my payment verification.
    
Subscription ID: ${subscriptionId}
Status: ${status}
Plan: ${planName}
URL: ${window.location.href}

Please help me resolve this issue.`);

    window.open(
      `mailto:support@ethicvoice.co?subject=${subject}&body=${body}`,
      "_blank",
    );
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className={`border-2 ${config.bgColor}`}>
          <CardHeader className="text-center pb-4 flex flex-col items-center">
            <div className="mb-4">
              <i
                className={`${config.icon} w-16 h-16 ${config.color} ${status === "loading" ? "animate-spin" : ""}`}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          </CardHeader>
          <CardBody className="text-center flex flex-col items-center">
            <p className="text-gray-600 mb-6 leading-relaxed">
              {config.description}
            </p>

            {subscriptionId && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>ID de suscripción:</strong> {subscriptionId}
                </p>
                {planName && (
                  <p className="text-sm text-gray-600">
                    <strong>Plan:</strong> {planName}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {status !== "loading" && (
                <Button
                  color={status === "failed" ? "danger" : "primary"}
                  size="lg"
                  onClick={handleContinue}
                  className="min-w-40"
                >
                  {status === "failed" ? "Reintentar" : "Ir al panel"}
                </Button>
              )}

              {status === "failed" && (
                <Button
                  variant="light"
                  size="lg"
                  onClick={handleContactSupport}
                  className="min-w-40"
                >
                  Contactar soporte
                </Button>
              )}

              {status === "loading" && (
                <Button disabled size="lg" className="min-w-40">
                  <Spinner size="sm" className="mr-2" />
                  Verificando...
                </Button>
              )}
            </div>

            {(status === "success" || status === "pending") && (
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>¿Qué sigue?</strong>
                  <br />
                  Crea tu organización y empieza a configurar tu canal de
                  denuncias. Tendrás acceso a todas las funciones incluidas en
                  tu plan.
                </p>
              </div>
            )}

            {status === "failed" && (
              <div className="bg-red-50 rounded-lg p-4 mt-6">
                <p className="text-sm text-red-800">
                  <strong>¿Necesitas ayuda?</strong> Contacta a nuestro equipo
                  de soporte con tu ID de suscripción para recibir asistencia
                  rápida.
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            🔒 Tu información de pago está protegida por nuestro proveedor de
            pagos
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
          <Spinner size="lg" color="primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
