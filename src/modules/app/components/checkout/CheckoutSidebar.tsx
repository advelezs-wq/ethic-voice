"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface CheckoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    id: number;
    planName: string;
    price: number; // ✅ Changed from 'amount' to 'price' to match backend
    currency: "USD" | "COP";
    returnUrl: string;
    paymentUrl?: string; // ✅ Add optional payment URL from Rebill
  } | null;
}

interface RebillSDK {
  checkout?: {
    create: (config: unknown) => {
      mount: (selector: string) => void;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      addEventListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    } | null;
  };
  card?: (config: unknown) => unknown;
  mount?: (selector: string) => void;
  render?: (selector: string) => void;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  addEventListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  [key: string]: any; // Allow any other properties
}

// Extend Window interface to include Rebill
declare global {
  interface Window {
    Rebill: any;
  }
}

export default function CheckoutSidebar({
  isOpen,
  onClose,
  subscription,
}: CheckoutSidebarProps) {
  const [sdkMounted, setSDKMounted] = useState<RebillSDK | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Refs to prevent multiple operations
  const formInjectedRef = useRef(false);
  const sdkInitializedRef = useRef(false);

  // Body scroll lock functionality
  useEffect(() => {
    if (isOpen) {
      // Disable body scroll when sidebar opens
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      // Cleanup function to restore scroll when sidebar closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle payment success - moved to component scope
  const handleSuccess = useCallback(
    (payment: {
      id: string;
      amount: number;
      currency: string;
      status: string;
    }) => {
      console.log("🎉 [PAYMENT] Payment successful:", payment);
      console.log("🎉 [PAYMENT] HandleSuccess callback triggered!");
      console.log(
        "🔍 [PAYMENT] Payment data received:",
        JSON.stringify(payment, null, 2)
      );

      setPaymentProcessing(false);
      setPaymentSuccess(true);

      // Set redirect URL to the proper onboarding flow
      console.log(
        "🔍 [DEBUG] Subscription data before redirect:",
        subscription
      );
      console.log("🔍 [DEBUG] Subscription ID:", subscription?.id);
      console.log("🔍 [DEBUG] Return URL:", subscription?.returnUrl);

      const subscriptionId = subscription?.id;
      if (!subscriptionId) {
        console.error(
          "❌ [REDIRECT] No subscription ID available for redirect"
        );
        setError("Error: No subscription ID found for redirect");
        return;
      }

      const redirectUrl = subscription?.returnUrl?.includes("?")
        ? `${subscription.returnUrl}&subscription_id=${subscriptionId}`
        : `${subscription.returnUrl}?status=success&subscription_id=${subscriptionId}`;

      setRedirectUrl(redirectUrl);

      // Immediate redirect (before onClose to prevent cancellation)
      console.log("🚀 [REDIRECT] Redirecting to:", redirectUrl);
      console.log("🔍 [DEBUG] Final subscription ID in URL:", subscriptionId);

      try {
        window.location.replace(redirectUrl);
        console.log("✅ [REDIRECT] Redirect initiated successfully");
      } catch (error) {
        console.error("❌ [REDIRECT] Redirect failed:", error);
        // Fallback to standard navigation
        window.location.href = redirectUrl;
      }

      // Close sidebar after redirect is initiated
      setTimeout(() => {
        onClose();
      }, 100);
    },
    [subscription?.returnUrl, onClose]
  ); // Stable dependencies

  // Handle payment error
  const handleError = useCallback((error: Error | string) => {
    console.error("❌ [PAYMENT] Payment failed:", error);
    setPaymentProcessing(false);
    setError("Payment failed. Please try again.");
  }, []); // No dependencies needed

  // Debug state changes only when sidebar opens/closes - not constantly
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 [SIDEBAR-OPENED]", {
        isOpen,
        loading,
        error,
        paymentProcessing,
        paymentSuccess,
        hasSubscription: !!subscription,
        subscriptionId: subscription?.id,
        redirectUrl,
      });
    }
  }, [isOpen]); // Only log when sidebar opens

  // ✅ CRITICAL FIX: Handle payment URL redirect instead of SDK
  useEffect(() => {
    console.log("🎬 [PAYMENT-INIT] Payment initialization effect triggered");

    if (!isOpen || !subscription) {
      console.log(
        "🚫 [PAYMENT-INIT] Conditions not met, skipping initialization"
      );
      return;
    }

    console.log("🎬 [SIDEBAR-INIT] Initializing sidebar with subscription:", {
      subscriptionId: subscription.id,
      planName: subscription.planName,
      price: subscription.price, // ✅ Changed from amount to price
      currency: subscription.currency,
      hasPaymentUrl: !!subscription.paymentUrl,
    });

    // ✅ If we have a payment URL from Rebill, redirect immediately
    if (subscription.paymentUrl) {
      console.log(
        "🚀 [REDIRECT] Redirecting to Rebill payment URL:",
        subscription.paymentUrl
      );
      setLoading(false);

      // Redirect to Rebill payment page
      window.location.href = subscription.paymentUrl;
      return;
    }

    // ✅ Fallback: Try to initialize Rebill SDK for legacy support
    if (typeof window !== "undefined" && window.Rebill && !sdkMounted) {
      console.log("✅ [SDK-CHECK] Rebill SDK found, initializing fallback...");

      try {
        const publicKey = process.env.NEXT_PUBLIC_REBILL_PUBLIC_KEY;
        console.log(
          "🔧 [SDK-MOUNT] Using API key:",
          publicKey ? `${publicKey.substring(0, 8)}...` : "undefined"
        );

        if (!publicKey) {
          throw new Error(
            "Missing NEXT_PUBLIC_REBILL_PUBLIC_KEY environment variable"
          );
        }

        const rebill = new window.Rebill(publicKey);
        console.log("✅ [SDK-MOUNT] Rebill instance created successfully");
        setSDKMounted(rebill);
        setLoading(false);
      } catch (err: unknown) {
        console.error("❌ [SDK-MOUNT] Failed to create Rebill instance:", err);
        setError("Failed to initialize payment system. Please try again.");
        setLoading(false);
      }
    } else {
      // No SDK and no payment URL - this shouldn't happen with the new flow
      console.warn(
        "⚠️ [PAYMENT-INIT] No payment URL and no Rebill SDK available"
      );
      setError("Payment system configuration error. Please try again.");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subscription, sdkMounted]);

  // ✅ Create and mount payment form when SDK is ready (FALLBACK ONLY)
  useEffect(() => {
    console.log("🔄 [MOUNT-EFFECT] Mount payment form effect triggered");

    // ✅ Skip SDK form if we have payment URL (we already redirected)
    if (subscription?.paymentUrl) {
      console.log(
        "🚫 [MOUNT-EFFECT] Payment URL available, skipping SDK form mount"
      );
      return;
    }

    if (!sdkMounted || !subscription || !isOpen) {
      console.log("🚫 [MOUNT-EFFECT] Conditions not met, skipping mount");
      return;
    }

    console.log("🎬 [FORM-MOUNT] Creating payment form following Rebill docs");

    try {
      // Create checkout form exactly like Rebill documentation
      if (!sdkMounted.checkout?.create) {
        throw new Error("Rebill checkout.create method not available");
      }

      const checkoutForm = sdkMounted.checkout.create({
        name: `Subscription - ${subscription.planName}`,
        amount: subscription.price, // ✅ Changed from amount to price
        currency: subscription.currency,
      });

      if (!checkoutForm) {
        throw new Error("Failed to create checkout form");
      }

      console.log("✅ [FORM-MOUNT] Checkout form created:", checkoutForm);

      // Mount the form to the container
      checkoutForm.mount("rebill-payment-form");
      console.log("✅ [FORM-MOUNT] Form mounted successfully");

      // Hide backup form
      const backupForm = document.getElementById("rebill-fallback-form");
      if (backupForm) {
        backupForm.style.display = "none";
        console.log("✅ [FORM-MOUNT] Backup form hidden");
      }

      // Set up event listeners if available
      if (checkoutForm.on) {
        console.log("🔄 [FORM-MOUNT] Setting up event listeners");

        // Primary success handler (cast to match SDK's unknown callback type)
        checkoutForm.on("success", handleSuccess as unknown as (...args: unknown[]) => void);
        checkoutForm.on("error", handleError as unknown as (...args: unknown[]) => void);

        // Alternative event names that Rebill might use
        checkoutForm.on("payment_success", handleSuccess as unknown as (...args: unknown[]) => void);
        checkoutForm.on("completed", handleSuccess as unknown as (...args: unknown[]) => void);
        checkoutForm.on("approved", handleSuccess as unknown as (...args: unknown[]) => void);

        // Debug all events
        const originalOn = checkoutForm.on as (event: string, cb: (...args: unknown[]) => void) => void;
        checkoutForm.on = function (
          eventName: string,
          callback: (...args: unknown[]) => void
        ) {
          console.log(
            `🎧 [EVENT-LISTENER] Registering listener for: ${eventName}`
          );
          return originalOn.call(this, eventName, callback);
        };

        // Log when any event is triggered
        if (typeof checkoutForm.addEventListener === "function") {
          console.log("🔄 [FORM-MOUNT] Adding generic event listener");
          checkoutForm.addEventListener(
            "*",
            ((...args: unknown[]) => {
              const eventName = String(args[0] ?? "");
              const data = args[1] as unknown;
              console.log(`🎯 [EVENT-FIRED] ${eventName}:`, data);
              if (
                eventName.toLowerCase().includes("success") ||
                eventName.toLowerCase().includes("completed")
              ) {
                console.log(
                  "🚀 [AUTO-SUCCESS] Auto-triggering success handler for event:",
                  eventName
                );
                handleSuccess(
                  (data as {
                    id: string;
                    amount: number;
                    currency: string;
                    status: string;
                  }) ||
                    ({
                      id: "unknown",
                      amount: 0,
                      currency: "USD",
                      status: "unknown",
                    } as any)
                );
              }
            }) as (...args: unknown[]) => void
          );
        }
      } else {
        console.warn(
          "⚠️ [FORM-MOUNT] checkoutForm.on is not available - event listeners not set up"
        );
      }

      setLoading(false);
    } catch (err: unknown) {
      console.error("❌ [FORM-MOUNT] Failed to create payment form:", err);
      setError("Failed to load payment form. Please try again.");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkMounted, subscription, isOpen, handleSuccess, handleError]);

  // ✅ Fallback polling to check payment status (ONLY for legacy/SDK payments)
  useEffect(() => {
    if (
      !subscription ||
      !isOpen ||
      paymentSuccess ||
      error ||
      subscription.paymentUrl
    )
      return;

    const pollPaymentStatus = async () => {
      try {
        console.log(
          `🔍 [POLL] Checking payment status for subscription ${subscription.id} (attempt ${pollCount + 1})`
        );

        const response = await fetch(`/api/subscriptions/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId: subscription.id }),
        });

        const data = await response.json();
        console.log("📊 [POLL] Status check response:", data);

        if (response.ok && data.success && data.status === "ACTIVE") {
          console.log(
            "🎉 [POLL] Payment confirmed by server - triggering redirect"
          );
          console.log("🔍 [POLL] Poll response data:", data);
          setPaymentProcessing(false);
          setPaymentSuccess(true);

          const subscriptionId = subscription?.id;
          if (!subscriptionId) {
            console.error(
              "❌ [POLL-REDIRECT] No subscription ID available for polling redirect"
            );
            return;
          }

          const redirectUrl = subscription?.returnUrl?.includes("?")
            ? `${subscription.returnUrl}&subscription_id=${subscriptionId}`
            : `${subscription.returnUrl}?status=success&subscription_id=${subscriptionId}`;
          setRedirectUrl(redirectUrl);

          console.log("🚀 [POLL-REDIRECT] Redirecting to:", redirectUrl);
          console.log(
            "🔍 [POLL-REDIRECT] Subscription ID in URL:",
            subscriptionId
          );
          window.location.replace(redirectUrl);
        } else if (pollCount < 10) {
          // Poll for up to 10 times (50 seconds)
          setPollCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("❌ [POLL] Error checking payment status:", err);
      }
    };

    // Start polling after 5 seconds, then every 5 seconds
    const timer = setTimeout(
      () => {
        pollPaymentStatus();
      },
      5000 + pollCount * 5000
    );

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription, isOpen, paymentSuccess, error, pollCount]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setSDKMounted(null);
      setLoading(true);
      setError(null);
      setPaymentProcessing(false);
      setPaymentSuccess(false);
      setRedirectUrl(null);
      setPollCount(0);
      // Reset refs to allow fresh injection next time
      formInjectedRef.current = false;
      sdkInitializedRef.current = false;
    }
  }, [isOpen]);

  // ✅ Enhanced validation to prevent undefined errors
  if (!subscription || !subscription.id || subscription.price === undefined) {
    console.log("🚫 [RENDER] Subscription validation failed:", {
      hasSubscription: !!subscription,
      hasId: subscription?.id !== undefined,
      hasPrice: subscription?.price !== undefined,
    });
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/60 z-[110] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-[111] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0 animate-slide-in-right" : "translate-x-full"
        }`}
      >
        {subscription && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Completar Pago
              </h2>
              <span className="text-sm text-gray-500 capitalize">
                {subscription.planName}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={paymentProcessing}
                aria-label="Close checkout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m6 6 12 12"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m6 18 12-12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {/* Plan Summary */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {subscription.planName}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-blue-700">Total</span>
                  <span className="text-lg font-bold text-blue-900">
                    {subscription.currency === "USD" ? "$" : "COP$ "}
                    {subscription.price?.toLocaleString() || "0"}{" "}
                    {/* ✅ Added defensive null check */}
                    <span className="text-sm font-normal text-blue-700">
                      {" "}
                      /month
                    </span>
                  </span>
                </div>
              </div>

              {/* Payment Processing Overlay */}
              {paymentProcessing && (
                <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-60">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Processing Payment...
                    </h3>
                    <p className="text-gray-600">
                      Please wait while we activate your subscription.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading state - show during form preparation */}
              {!paymentSuccess && loading && !error && subscription && (
                <div className="animate-pulse text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-blue-600 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    Preparing Payment
                  </h3>
                  <p className="text-gray-600">
                    Setting up your secure payment form...
                  </p>
                </div>
              )}

              {/* Payment Form - Show when ready for payment */}
              {!paymentSuccess && !loading && !error && subscription && (
                <div>
                  <div id="rebill-payment-form" className="w-full">
                    {/* Rebill payment form will be mounted here */}
                  </div>

                  {/* Backup form - shown by default, hidden when Rebill form loads */}
                  <div
                    id="rebill-fallback-form"
                    className="w-full bg-gray-50 rounded-lg p-6 text-center"
                    style={{ display: "block" }}
                  >
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        Cargando Formulario de Pago Seguro...
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Por favor espera mientras nos conectamos a nuestra
                        pasarela de pago segura.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4 border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-semibold">
                          {subscription.planName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monto:</span>
                        <span className="font-semibold text-blue-600">
                          {subscription.currency}{" "}
                          {subscription.price?.toLocaleString() || "0"}{" "}
                          {/* ✅ Added defensive null check */}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      If this page doesn&apos;t load, please refresh your
                      browser or contact support.
                    </p>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center text-xs text-gray-500 mb-2">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Secure payment powered by Rebill
                    </div>
                    <p className="text-xs text-gray-400">
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="text-red-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error de Pago
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                      <button
                        onClick={() => {
                          setError(null);
                          setLoading(true);
                          setSDKMounted(null);
                          formInjectedRef.current = false;
                          sdkInitializedRef.current = false;
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Intentar de Nuevo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State - ONLY after actual payment */}
              {paymentSuccess && !error && subscription && (
                <div className="text-center animate-fade-in">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      ¡Orden confirmada!
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      En los próximos minutos recibirá un correo electrónico con
                      la confirmación de su pedido.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">
                        🚀 Redirigiendo a la configuración de su organización...
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        Por favor espere mientras preparamos su cuenta
                      </p>
                    </div>

                    {/* Manual redirect button if auto-redirect fails */}
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          if (redirectUrl) {
                            console.log(
                              "🔘 Manual redirect button clicked:",
                              redirectUrl
                            );
                            window.location.href = redirectUrl;
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Continuar a configuración →
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Si no se redirige automáticamente, haga clic en el botón
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
