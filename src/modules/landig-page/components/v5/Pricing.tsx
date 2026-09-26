"use client";

import {
  Button,
  Container,
  Eyebrow,
  RevealHeading,
  Voice,
  reveal,
} from "@/modules/brand/components/primitives";
import { trackCta, useDemoCta } from "@/modules/brand/hooks/useDemoCta";
import { BillingCycle, PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { PREMIUM_JOURNEY } from "./content";

const PLAN_ORDER = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO] as const;

function Check({ dark }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
      <path
        d="M3 8.5 6.5 12 13 4.5"
        stroke={dark ? "#98D050" : "#44731A"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Planes en columnas de registro; el recomendado se invierte a tinta. */
export function Pricing() {
  const demo = useDemoCta();
  const premium = PLAN_CONFIGS[PlanType.PREMIUM];

  const goToCheckout = (planType: PlanType) => {
    trackCta(`pricing_${planType.toLowerCase()}`, "pricing");
    window.location.href = `/pricing?plan=${planType}&billing=${BillingCycle.MONTHLY}`;
  };

  return (
    <section id="planes" className="relative scroll-mt-20 bg-ev-paper py-28 sm:py-36">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Eyebrow index="08">Planes</Eyebrow>
          </div>
          <div className="lg:col-span-9">
            <RevealHeading
              className="ev-h2 text-ev-night"
              lines={[
                "Precios claros para cada",
                <>
                  etapa de tu <Voice>organización.</Voice>
                </>,
              ]}
            />
            <p className="ev-label mt-6 text-ev-mute">
              USD / mes · Sin permanencia · Activación en días
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-3 md:grid-cols-3 md:gap-0">
          {PLAN_ORDER.map((planType, i) => {
            const plan = PLAN_CONFIGS[planType];
            const popular = !!plan.isPopular;
            const employees =
              plan.features.maxEmployees === -1
                ? "Colaboradores ilimitados"
                : `Hasta ${plan.features.maxEmployees} colaboradores`;
            return (
              <article
                key={planType}
                {...reveal(i * 100)}
                className={`relative flex flex-col rounded-[1.5rem] p-7 sm:p-9 md:rounded-none ${
                  popular
                    ? "z-10 bg-ev-night text-white md:-my-4 md:rounded-[1.5rem] md:py-12 md:shadow-[0_40px_80px_-30px_rgba(11,29,33,0.5)]"
                    : "border border-ev-line bg-white/50 md:border-0 md:border-t md:border-ev-night md:bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">
                    {plan.displayName.replace("EthicVoice ", "")}
                  </h3>
                  {popular && (
                    <span className="ev-label rounded-full bg-ev-signal px-2.5 py-1 text-ev-night">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className={`mt-3 min-h-[3rem] text-[0.9375rem] leading-relaxed ${popular ? "text-white/60" : "text-ev-mute"}`}>
                  {plan.description}
                </p>

                <p className="mt-8 flex items-baseline gap-2">
                  <span className="ev-num text-[4rem] font-semibold leading-none tracking-[-0.06em]">
                    ${plan.price.monthly}
                  </span>
                  <span className={`ev-label ${popular ? "text-white/50" : "text-ev-mute"}`}>USD/mes</span>
                </p>
                <p className={`ev-label mt-3 ${popular ? "text-ev-signal" : "text-ev-moss"}`}>{employees}</p>

                <ul className={`mt-8 flex-1 space-y-3 border-t pt-6 text-[0.9375rem] ${popular ? "border-white/10 text-white/80" : "border-ev-line text-ev-ink"}`}>
                  {plan.features.highlights.slice(0, 5).map((h) => (
                    <li key={h} className="flex gap-3 leading-snug">
                      <Check dark={popular} />
                      {h}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={popular ? "signal" : "outline"}
                  arrow
                  className="mt-10 w-full"
                  onClick={() => goToCheckout(planType)}
                >
                  Comenzar con {plan.displayName.replace("EthicVoice ", "")}
                </Button>
              </article>
            );
          })}
        </div>

        {/* Premium: implementación a medida */}
        <article
          {...reveal(100)}
          className="mt-16 grid gap-10 rounded-[1.75rem] border border-ev-night/10 bg-white p-7 sm:p-10 lg:grid-cols-12 lg:gap-8 lg:p-12"
        >
          <div className="lg:col-span-4">
            <p className="ev-label text-ev-moss">Plan empresarial</p>
            <h3 className="mt-4 text-[2.5rem] font-semibold leading-none tracking-[-0.05em] text-ev-night">
              {premium.displayName.replace("EthicVoice ", "")}
            </h3>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-ev-mute">
              {premium.description}
            </p>
            <p className="ev-label mt-6 text-ev-night">Precio bajo consulta · según alcance</p>
            <Button variant="ink" arrow className="mt-8" onClick={demo("pricing_enterprise", "pricing")}>
              Hablar con un consultor
            </Button>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-2xl bg-ev-line sm:grid-cols-2 lg:col-span-8">
            {PREMIUM_JOURNEY.map((s) => (
              <li key={s.step} className="bg-white p-6">
                <span className="ev-label text-ev-moss">{s.step}</span>
                <p className="mt-6 text-lg font-semibold tracking-[-0.02em] text-ev-night">{s.title}</p>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ev-mute">{s.desc}</p>
              </li>
            ))}
          </ol>
        </article>

        <p className="ev-label mt-8 text-ev-haze">
          * Precios en USD. La configuración final depende del alcance de implementación.
        </p>
      </Container>
    </section>
  );
}
