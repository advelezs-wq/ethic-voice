"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
  formatPriceForUI,
} from "@/types/subscription.types";
import { useExchangeRate } from "@/modules/core/hooks/useExchangeRate";
import { motion } from "framer-motion";
import CheckoutSidebar from "@/modules/app/components/checkout/CheckoutSidebar";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import { MarketingSectionV2 } from "@/modules/landig-page/components/MarketingSectionV2";
import { showError } from "@/modules/core/utils/safe-toast";

interface PricingPlansProps {
  billingCycle: BillingCycle;
}

export default function PricingPlans({ billingCycle }: PricingPlansProps) {
  const { openCalendly } = useCalendlyGate();
  const { isSignedIn, isLoaded } = useUser();
  const { rates } = useExchangeRate({ base: "USD", symbols: ["COP"] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [checkoutSidebarOpen, setCheckoutSidebarOpen] = useState(false);
  const autoFlowTriggeredRef = useRef(false);
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

  const resolvePlanType = (raw: string | null): PlanType | null => {
    if (!raw) return null;
    if ((Object.values(PlanType) as string[]).includes(raw)) {
      return raw as PlanType;
    }
    return null;
  };

  const resolveBillingCycle = (raw: string | null): BillingCycle => {
    if (!raw) return billingCycle;
    if ((Object.values(BillingCycle) as string[]).includes(raw)) {
      return raw as BillingCycle;
    }
    return billingCycle;
  };

  const redirectToSignUp = (planType: PlanType, cycle: BillingCycle) => {
    localStorage.setItem("selectedPlan", planType);
    localStorage.setItem("selectedBillingCycle", cycle);
    const returnUrl = encodeURIComponent(
      `${window.location.origin}/pricing?plan=${planType}&billing=${cycle}`,
    );
    window.location.href = `/auth/sign-up?redirect_url=${returnUrl}`;
  };

  const startCheckoutFlow = async (planType: PlanType, cycle: BillingCycle) => {
    setIsProcessing(true);
    setSelectedPlan(planType);

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          billingCycle: cycle,
          returnUrl: "/app",
          openSidebar: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la suscripción");
      }

      if (data.alreadyActive) {
        window.location.href = data.redirectUrl || "/app";
        return;
      }

      if (data.subscription) {
        setSubscription({
          id: data.subscription.id,
          planName: data.subscription.planName,
          price: data.subscription.price,
          currency: data.subscription.currency,
          returnUrl: data.subscription.returnUrl || "/app",
          paymentUrl: data.subscription.paymentUrl,
          ...(planType ? { planType } : {}),
          billingCycle: cycle,
        });
        setCheckoutSidebarOpen(true);
      }
    } catch (error) {
      console.error("❌ Subscription error:", error);
      showError(
        "Error al procesar la suscripción",
        error instanceof Error ? error.message : "Intenta de nuevo",
      );
      autoFlowTriggeredRef.current = false;
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePlanSelect = async (planType: PlanType) => {
    const plan = PLAN_CONFIGS[planType];

    // Handle Premium plan (contact us)
    if (planType === "PREMIUM") {
      openCalendly();
      return;
    }

    // Wait for auth to be loaded
    if (!isLoaded) {
      return;
    }

    // Check if user is authenticated
    if (!isSignedIn) {
      redirectToSignUp(planType, billingCycle);
      return;
    }

    await startCheckoutFlow(planType, billingCycle);
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
  useEffect(() => {
    if (!isLoaded || isProcessing || autoFlowTriggeredRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = resolvePlanType(urlParams.get("plan"));
    const billingFromUrl = resolveBillingCycle(urlParams.get("billing"));
    const planFromStorage = resolvePlanType(
      localStorage.getItem("selectedPlan"),
    );
    const billingFromStorage = resolveBillingCycle(
      localStorage.getItem("selectedBillingCycle"),
    );

    const plan = planFromUrl || planFromStorage;
    const cycle = planFromUrl ? billingFromUrl : billingFromStorage;
    if (!plan || plan === PlanType.PREMIUM) return;

    autoFlowTriggeredRef.current = true;

    if (!isSignedIn) {
      redirectToSignUp(plan, cycle);
      return;
    }

    localStorage.removeItem("selectedPlan");
    localStorage.removeItem("selectedBillingCycle");
    if (planFromUrl) {
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState(null, "", cleanUrl);
    }

    void startCheckoutFlow(plan, cycle);
  }, [isLoaded, isSignedIn, isProcessing, billingCycle]);

  const displayPlans = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO];
  const premiumConfig = PLAN_CONFIGS[PlanType.PREMIUM];

  const enterpriseFeatures = [
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
      iconClass: "icon-[lucide--chart-column]",
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
  ];

  return (
    <>
      <MarketingSectionV2
        id="planes-precio"
        eyebrow="Comparar"
        title="Elige la capacidad que necesitas"
        subtitle="Precios en USD según ciclo de facturación. Valor en COP orientativo según tipo de cambio del día."
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8">
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: displayPlans.indexOf(planType) * 0.08,
                }}
                className={`relative flex min-h-[520px] flex-col rounded-xl border bg-white p-6 transition-all duration-300 sm:min-h-[560px] sm:p-7 md:p-8 ${
                  isPopular
                    ? "border-2 border-lime-500 shadow-2xl shadow-lime-900/10"
                    : "border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-lime-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
                      Recomendado
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="mb-2 text-2xl font-semibold text-[#0d212c]">
                    {config.displayName}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#273c46]">
                    {config.description}
                  </p>
                </div>

                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Precio
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-1">
                    <span
                      className={`font-extrabold text-[#0d212c] ${
                        priceDisplay.size === "large"
                          ? "text-3xl md:text-4xl"
                          : priceDisplay.size === "medium"
                            ? "text-2xl md:text-3xl"
                            : "text-xl md:text-2xl"
                      }`}
                    >
                      {priceDisplay.formatted}
                    </span>
                    <span className="text-sm font-medium text-[#273c46]">
                      /{billingCycle === BillingCycle.YEARLY ? "año" : "mes"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {rates?.COP
                      ? `≈ ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(Math.round(monthlyUsd * rates.COP))} COP/mes`
                      : "\u00a0"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlanSelect(planType)}
                  disabled={isProcessing && selectedPlan === planType}
                  className={`mb-6 w-full rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 disabled:opacity-60 ${
                    isPopular
                      ? "bg-lime-600 text-white shadow-lg hover:bg-lime-700"
                      : "border-2 border-lime-600 text-lime-800 hover:bg-lime-600 hover:text-white"
                  }`}
                >
                  {isProcessing && selectedPlan === planType
                    ? "Procesando..."
                    : "Iniciar sesión y continuar"}
                </button>

                <div className="flex flex-1 flex-col space-y-3">
                  {config.features.highlights.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <i className="icon-[lucide--circle-check] mt-0.5 h-5 w-5 shrink-0 text-lime-600" />
                      <span className="text-sm text-[#273c46]">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mx-auto mt-14 max-w-5xl">
          <div className="mb-8 text-center">
            <h3 className="text-balance text-2xl font-extrabold tracking-tight text-[#0d212c] md:text-3xl">
              ¿Necesitas algo más específico?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[#273c46]">
              Si estos planes no se ajustan a tus necesidades, creemos una
              solución personalizada para tu organización. Desde startups hasta
              grandes corporaciones.
            </p>
          </div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-emerald-400/35 bg-gradient-to-br from-[#051a24] via-[#0d212c] to-[#052b24] p-6 shadow-2xl lg:p-10"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
              aria-hidden
            />
            <div className="relative grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Plan personalizado
                </span>
                <h4 className="mt-4 text-2xl font-bold text-white md:text-3xl">
                  {premiumConfig.displayName}
                </h4>
                <p className="mt-3 text-base leading-relaxed text-white/80">
                  {premiumConfig.description}
                </p>
                <a
                  href={generateCustomPlanEmail()}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-400 px-6 py-3.5 text-sm font-bold text-[#052b24] shadow-lg transition-colors hover:bg-lime-500 sm:w-auto"
                >
                  <i className="icon-[lucide--calendar] h-5 w-5" aria-hidden />
                  Agendar consulta gratuita
                </a>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                {enterpriseFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      <i
                        className={`${feature.iconClass} mt-0.5 h-5 w-5 shrink-0 text-emerald-300`}
                      />
                      <div>
                        <h5 className="text-sm font-semibold text-white">
                          {feature.title}
                        </h5>
                        <p className="mt-0.5 text-xs leading-snug text-white/75">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>
        </div>
      </MarketingSectionV2>

      {checkoutSidebarOpen && subscription && (
        <CheckoutSidebar
          isOpen={checkoutSidebarOpen}
          onClose={handleCloseSidebar}
          subscription={subscription}
        />
      )}
    </>
  );
}
