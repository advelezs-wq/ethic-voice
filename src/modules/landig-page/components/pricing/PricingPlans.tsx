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
import CheckoutSidebar from "@/modules/app/components/checkout/CheckoutSidebar";
import { useCalendlyGate } from "@/lib/cookie-consent/useCalendlyGate";
import {
  Button,
  Container,
  buttonClasses,
  reveal,
} from "@/modules/brand/components/primitives";
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
          fromLanding: true,
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
    { title: "Usuarios ilimitados", desc: "Sin restricciones de equipo" },
    { title: "Todos los canales", desc: "Web, correo, chatbot y teléfono" },
    { title: "IA avanzada completa", desc: "Procesamiento y análisis automatizado" },
    { title: "Analíticas premium", desc: "Reportes detallados y métricas" },
    { title: "Seguridad empresarial", desc: "Cumplimiento y encriptación" },
    { title: "Soporte prioritario", desc: "Atención personalizada 24/7" },
    { title: "Personalización total", desc: "Branding y diseño exclusivo" },
    { title: "Capacitación completa", desc: "Formación para investigadores" },
    { title: "Consultoría legal", desc: "Asesoría especializada incluida" },
    { title: "Integración API", desc: "Conecta tus sistemas existentes" },
    { title: "SLA garantizado", desc: "Tiempos de respuesta asegurados" },
    { title: "Soporte multiidioma", desc: "Disponible en varios idiomas" },
  ];

  const ctaLabel = (planType: PlanType) => {
    if (isProcessing && selectedPlan === planType) return "Procesando…";
    const name = PLAN_CONFIGS[planType].displayName.replace("EthicVoice ", "");
    return isSignedIn ? `Contratar ${name}` : `Empezar con ${name}`;
  };

  return (
    <>
      <section id="planes-precio" className="scroll-mt-20 bg-ev-paper pb-24 sm:pb-32">
        <Container>
          <div className="grid gap-3 md:grid-cols-3 md:gap-0">
            {displayPlans.map((planType, i) => {
              const config = PLAN_CONFIGS[planType];
              const price = getPrice(planType);
              const popular = !!config.isPopular;
              const priceDisplay = formatPriceForUI(price ?? 0);
              const monthlyUsd =
                billingCycle === BillingCycle.YEARLY ? (price ?? 0) / 12 : (price ?? 0);

              return (
                <article
                  key={planType}
                  {...reveal(i * 100)}
                  className={`relative flex flex-col rounded-[1.5rem] p-7 sm:p-9 md:rounded-none ${
                    popular
                      ? "z-10 bg-ev-night text-white md:-my-4 md:rounded-[1.5rem] md:py-12 md:shadow-[0_40px_80px_-30px_rgba(11,29,33,0.5)]"
                      : "border border-ev-line bg-white/50 text-ev-night md:border-0 md:border-t md:border-ev-night md:bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">
                      {config.displayName.replace("EthicVoice ", "")}
                    </h3>
                    {popular && (
                      <span className="ev-label rounded-full bg-ev-signal px-2.5 py-1 text-ev-night">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className={`mt-3 min-h-[4.5rem] text-[0.9375rem] leading-relaxed ${popular ? "text-white/60" : "text-ev-mute"}`}>
                    {config.description}
                  </p>

                  <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                    <span className="ev-num text-[3.75rem] font-semibold leading-none tracking-[-0.06em]">
                      {priceDisplay.formatted}
                    </span>
                    <span className={`ev-label ${popular ? "text-white/50" : "text-ev-mute"}`}>
                      USD/{billingCycle === BillingCycle.YEARLY ? "año" : "mes"}
                    </span>
                  </p>
                  <p className={`ev-label mt-3 min-h-[1rem] ${popular ? "text-white/45" : "text-ev-haze"}`}>
                    {rates?.COP
                      ? `≈ ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(Math.round(monthlyUsd * rates.COP))} COP/mes`
                      : "\u00a0"}
                  </p>

                  <Button
                    variant={popular ? "signal" : "outline"}
                    arrow
                    className="mt-8 w-full"
                    onClick={() => handlePlanSelect(planType)}
                    disabled={isProcessing && selectedPlan === planType}
                  >
                    {ctaLabel(planType)}
                  </Button>

                  <ul className={`mt-8 flex-1 space-y-3 border-t pt-6 text-[0.9375rem] ${popular ? "border-white/10 text-white/80" : "border-ev-line text-ev-ink"}`}>
                    {config.features.highlights.map((feature) => (
                      <li key={feature} className="flex gap-3 leading-snug">
                        <svg viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
                          <path d="M3 8.5 6.5 12 13 4.5" stroke={popular ? "#98D050" : "#44731A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          {/* Premium */}
          <article
            {...reveal(100)}
            className="ev-grain ev-grain-dark relative mt-20 grid gap-12 overflow-hidden rounded-[1.75rem] bg-ev-night p-7 text-white sm:p-10 lg:grid-cols-12 lg:gap-8 lg:p-14"
          >
            <div className="lg:col-span-5">
              <p className="ev-label text-ev-signal">¿Necesitas algo más específico?</p>
              <h3 className="mt-5 text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-none tracking-[-0.05em]">
                {premiumConfig.displayName.replace("EthicVoice ", "")}
              </h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/65">
                {premiumConfig.description}
              </p>
              <p className="ev-label mt-6 text-white/45">Precio bajo consulta · según alcance</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="signal" arrow onClick={() => openCalendly()}>
                  Agendar consulta gratuita
                </Button>
                <a href={generateCustomPlanEmail()} className={buttonClasses("outline-dark")}>
                  Escribir a ventas
                </a>
              </div>
            </div>
            <dl className="grid gap-x-8 sm:grid-cols-2 lg:col-span-7">
              {enterpriseFeatures.map((f) => (
                <div key={f.title} className="border-t border-white/10 py-4">
                  <dt className="text-[0.975rem] font-medium tracking-[-0.01em]">{f.title}</dt>
                  <dd className="mt-1 text-sm text-white/50">{f.desc}</dd>
                </div>
              ))}
            </dl>
          </article>
        </Container>
      </section>

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
