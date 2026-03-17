"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@heroui/react";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
  formatPriceForUI,
} from "@/types/subscription.types";
import { useExchangeRate } from "@/modules/core/hooks/useExchangeRate";
// Removed CheckIcon import - using iconify icons instead
import { motion } from "framer-motion";
import CheckoutSidebar from "@/modules/app/components/checkout/CheckoutSidebar";

interface PricingPlansProps {
  billingCycle: BillingCycle;
}

export default function PricingPlans({ billingCycle }: PricingPlansProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { rates } = useExchangeRate({ base: "USD", symbols: ["COP"] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [checkoutSidebarOpen, setCheckoutSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<{
    id: number;
    planName: string;
    price: number;
    currency: "USD" | "COP";
    returnUrl: string;
    paymentUrl?: string;
    planType?: PlanType | string;
    billingCycle?: BillingCycle | string;
  } | null>(null);

  const getPrice = (planType: PlanType) => {
    const config = PLAN_CONFIGS[planType];
    if (planType === PlanType.PREMIUM) return null;

    const price =
      billingCycle === BillingCycle.YEARLY
        ? config.price.yearly!
        : config.price.monthly;
    return price;
  };

  const handlePlanSelect = async (planType: PlanType) => {
    const plan = PLAN_CONFIGS[planType];

    // Handle Premium plan (contact us)
    if (planType === "PREMIUM") {
      window.open("https://calendly.com/ethicvoice-info/30min", "_blank");
      return;
    }

    // Wait for auth to be loaded
    if (!isLoaded) {
      return;
    }

    // Check if user is authenticated
    if (!isSignedIn) {
      // Store selected plan in localStorage to restore after sign-in
      localStorage.setItem("selectedPlan", planType);
      localStorage.setItem("selectedBillingCycle", billingCycle);
      // Redirect to sign-in with return URL
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/pricing?plan=${planType}&billing=${billingCycle}`
      );
      window.location.href = `/auth/sign-in?redirect_url=${returnUrl}`;
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(planType);

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: planType,
          billingCycle: billingCycle,
          returnUrl: "/app",
          openSidebar: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
      }

      const data = await response.json();
      console.log("✅ Subscription created:", data);

      if (data.subscription) {
        setSubscription({
          id: data.subscription.id,
          planName: data.subscription.planName,
          price: data.subscription.price,
          currency: data.subscription.currency,
          returnUrl: data.subscription.returnUrl || "/app",
          paymentUrl: data.subscription.paymentUrl,
          // Attach context for token flow
          ...(planType ? { planType } : {}),
          billingCycle: billingCycle,
        });
        setCheckoutSidebarOpen(true);
      }
    } catch (error) {
      console.error("❌ Subscription error:", error);
      alert(`Error al procesar tu suscripción: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCloseSidebar = () => {
    setCheckoutSidebarOpen(false);
    setSubscription(null);
  };

  // Generate email template for custom plan
  const generateCustomPlanEmail = () => {
    const subject =
      "Consulta por Plan Personalizado EthicVoice - Línea Ética Empresarial";
    const body = `Hola equipo de EthicVoice,

Estoy interesado en conocer más sobre el Plan Personalizado de línea ética para mi organización.

Información de mi empresa:
- Nombre de la empresa: [Tu empresa]
- Número de empleados: [Cantidad]
- Industria/Sector: [Tu industria]
- Volumen estimado de reportes/mes: [Cantidad]
- Requerimientos específicos: [Describe tus necesidades]

Me gustaría programar una reunión para discutir:
✓ Usuarios e investigadores ilimitados
✓ Todos los canales de reporte (Web, Email, Chatbot, Teléfono)
✓ IA avanzada para análisis automático de denuncias
✓ Analíticas premium y reportes ejecutivos
✓ Seguridad empresarial y cumplimiento normativo
✓ Soporte prioritario 24/7
✓ Personalización total del branding
✓ Capacitación completa para investigadores
✓ Consultoría legal especializada
✓ Integración API con sistemas existentes
✓ SLA garantizado y soporte multiidioma

¿Cuándo podríamos agendar una llamada para evaluar nuestras necesidades específicas?

Gracias,
[Tu nombre]
[Tu cargo]
[Tu teléfono]
[Tu email corporativo]`;

    return `mailto:ventas@ethicvoice.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Check if user returned from sign-in with a selected plan
  React.useEffect(() => {
    if (isSignedIn && isLoaded && !isProcessing) {
      // Check for plan in URL params (from redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const planFromUrl = urlParams.get("plan");
      const billingFromUrl = urlParams.get("billing");

      // Or check localStorage
      const planFromStorage = localStorage.getItem("selectedPlan");
      const billingFromStorage = localStorage.getItem("selectedBillingCycle");

      const selectedPlanType = planFromUrl || planFromStorage;
      const selectedBillingCycle = billingFromUrl || billingFromStorage;

      if (
        selectedPlanType &&
        Object.keys(PLAN_CONFIGS).includes(selectedPlanType as PlanType)
      ) {
        // Clear stored plan
        localStorage.removeItem("selectedPlan");
        localStorage.removeItem("selectedBillingCycle");

        // Auto-trigger plan selection by directly calling the logic
        const planType = selectedPlanType as PlanType;
        if (planType !== "PREMIUM") {
          // Set processing state first
          setIsProcessing(true);
          setSelectedPlan(planType);

          // Create subscription
          fetch("/api/subscriptions/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planType: planType,
              billingCycle: selectedBillingCycle || billingCycle,
              returnUrl: "/app",
              openSidebar: true,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  errorData.error || "Failed to create subscription"
                );
              }
              return response.json();
            })
            .then((data) => {
              console.log("✅ Auto-subscription created:", data);
              if (data.subscription) {
                setSubscription({
                  id: data.subscription.id,
                  planName: data.subscription.planName,
                  price: data.subscription.price,
                  currency: data.subscription.currency,
                  returnUrl: data.subscription.returnUrl || "/app",
                  paymentUrl: data.subscription.paymentUrl,
                  planType: planType,
                  billingCycle: (selectedBillingCycle || billingCycle) as any,
                });
                setCheckoutSidebarOpen(true);
              }
            })
            .catch((error) => {
              console.error("❌ Auto-subscription error:", error);
              alert(`Error al procesar tu suscripción: ${error.message}`);
            })
            .finally(() => {
              setIsProcessing(false);
              setSelectedPlan(null);
            });
        }

        // Clean up URL if plan was in URL
        if (planFromUrl) {
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState(null, "", newUrl);
        }
      }
    }
  }, [isSignedIn, isLoaded, isProcessing, billingCycle]);

  const displayPlans = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO];
  const customPlan = PlanType.PREMIUM;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {displayPlans.map((planType) => {
            const config = PLAN_CONFIGS[planType];
            const price = getPrice(planType);
            const isPopular = config.isPopular;
            const priceDisplay = formatPriceForUI(price ?? 0);
            const monthlyUsd =
              billingCycle === BillingCycle.YEARLY
                ? (price ?? 0) / 12
                : (price ?? 0);

            return (
              <motion.div
                key={planType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: displayPlans.indexOf(planType) * 0.1,
                }}
                className={`relative bg-white rounded-xl p-6 sm:p-7 md:p-8 min-h-[560px] md:min-h-[600px] transition-all duration-300 ${
                  isPopular
                    ? "border-2 border-green-500 shadow-2xl"
                    : "border border-gray-200 shadow-lg hover:shadow-xl"
                }`}
              >
                {/* Recommended Chip */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                      Recomendado
                    </span>
                  </div>
                )}
                {/* Title */}
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {config.displayName}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6 md:mb-8">
                  <div className="flex items-baseline flex-wrap">
                    <span
                      className={`font-extrabold text-gray-900 ${
                        priceDisplay.size === "large"
                          ? "text-4xl md:text-5xl"
                          : priceDisplay.size === "medium"
                            ? "text-3xl md:text-4xl"
                            : "text-2xl md:text-3xl"
                      }`}
                    >
                      {priceDisplay.formatted}
                    </span>
                    <span className="text-sm text-gray-600 ml-1 flex-shrink-0">
                      /{billingCycle === BillingCycle.YEARLY ? "año" : "mes"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {rates?.COP
                      ? `≈ ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(Math.round(monthlyUsd * rates.COP))} COP/mes`
                      : ""}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mb-6 md:mb-8">
                  <Button
                    onClick={() => handlePlanSelect(planType)}
                    disabled={isProcessing && selectedPlan === planType}
                    className={`w-full py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isPopular
                        ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                        : "border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    }`}
                  >
                    {isProcessing && selectedPlan === planType
                      ? "Procesando..."
                      : "Iniciar Sesión y Continuar"}
                  </Button>
                </div>

                {/* Features */}
                <div className="space-y-3 md:space-y-4">
                  {config.features.highlights.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <i className="icon-[lucide--check] w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Custom Plan Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-8"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Necesitas algo más específico?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Si estos planes no se ajustan a tus necesidades, creemos una
              solución personalizada para tu organización. Desde startups hasta
              grandes corporaciones.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-8 lg:p-12 shadow-2xl border-2 border-purple-400 overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              {/* Left Column - Content */}
              <div>
                <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6">
                  <span className="text-white font-semibold text-sm">
                    Plan Personalizado
                  </span>
                </div>

                <h4 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                  Solución Empresarial Completa
                </h4>

                <p className="text-purple-100 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                  Una plataforma de línea ética completamente adaptada a las
                  necesidades específicas de tu organización. Incluye todo lo
                  necesario para gestionar denuncias y mantener un ambiente
                  laboral ético.
                </p>

                <Button
                  as="a"
                  href={generateCustomPlanEmail()}
                  className="bg-white text-purple-700 hover:bg-purple-50 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  <i className="icon-[lucide--calendar] w-5 h-5 mr-2" />
                  Agendar Consulta Gratuita
                </Button>
              </div>

              {/* Right Column - Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* All Premium Features */}
                {[
                  {
                    iconClass: "icon-[lucide--users]",
                    title: "Usuarios Ilimitados",
                    desc: "Sin restricciones de equipo",
                  },
                  {
                    iconClass: "icon-[lucide--mail]",
                    title: "Todos los Canales",
                    desc: "Web, Email, Chatbot, Teléfono",
                  },
                  {
                    iconClass: "icon-[lucide--brain]",
                    title: "IA Avanzada Completa",
                    desc: "Procesamiento y análisis automatizado",
                  },
                  {
                    iconClass: "icon-[lucide--chart-bar]",
                    title: "Analíticas Premium",
                    desc: "Reportes detallados y métricas",
                  },
                  {
                    iconClass: "icon-[lucide--shield-check]",
                    title: "Seguridad Empresarial",
                    desc: "Cumplimiento y encriptación",
                  },
                  {
                    iconClass: "icon-[lucide--headphones]",
                    title: "Soporte Prioritario",
                    desc: "Atención personalizada 24/7",
                  },
                  {
                    iconClass: "icon-[lucide--palette]",
                    title: "Personalización Total",
                    desc: "Branding y diseño exclusivo",
                  },
                  {
                    iconClass: "icon-[lucide--graduation-cap]",
                    title: "Capacitación Completa",
                    desc: "Training para investigadores",
                  },
                  {
                    iconClass: "icon-[lucide--scale]",
                    title: "Consultoría Legal",
                    desc: "Asesoría especializada incluida",
                  },
                  {
                    iconClass: "icon-[lucide--cog]",
                    title: "Integración API",
                    desc: "Conecta con tus sistemas existentes",
                  },
                  {
                    iconClass: "icon-[lucide--clock]",
                    title: "SLA Garantizado",
                    desc: "Tiempos de respuesta asegurados",
                  },
                  {
                    iconClass: "icon-[lucide--globe]",
                    title: "Soporte Multiidioma",
                    desc: "Disponible en varios idiomas",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20"
                  >
                    <div className="flex items-start gap-3">
                      <i className={`${feature.iconClass} w-5 h-5 text-white flex-shrink-0 mt-1`} />
                      <div>
                        <h5 className="text-white font-semibold text-xs sm:text-sm mb-1">
                          {feature.title}
                        </h5>
                        <p className="text-purple-100 text-[11px] sm:text-xs">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Checkout Sidebar */}
      {checkoutSidebarOpen && subscription && (
        <CheckoutSidebar
          isOpen={checkoutSidebarOpen}
          onClose={handleCloseSidebar}
          subscription={subscription}
        />
      )}
    </section>
  );
}
