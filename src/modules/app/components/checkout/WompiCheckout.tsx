"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/modules/brand/components/Logo";
import { BillingCycle, PLAN_CONFIGS, PlanType } from "@/types/subscription.types";
import { WompiCardForm, useWompiAcceptance, type TokenizedCard } from "./WompiCardForm";

type Context = {
  email: string;
  organization: { id: string; name: string; hasActivePlan: boolean } | null;
  current?: { planType: PlanType; billingCycle: BillingCycle; online: boolean } | null;
  isMemberElsewhere?: boolean;
};

type Phase =
  | { kind: "form" }
  | { kind: "processing"; transactionId: string }
  | { kind: "approved" }
  | { kind: "declined"; reason: string };

const cop = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

export function WompiCheckout({ planType, billingCycle }: { planType: PlanType; billingCycle: BillingCycle }) {
  const cfg = PLAN_CONFIGS[planType];
  const yearly = billingCycle === BillingCycle.YEARLY;
  const priceCop = yearly ? cfg.priceCop.yearly : cfg.priceCop.monthly;
  const priceUsd = yearly ? cfg.price.yearly : cfg.price.monthly;

  const { acceptance, acceptanceError } = useWompiAcceptance();
  const [ctx, setCtx] = useState<Context | null>(null);
  const [orgName, setOrgName] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/context", { cache: "no-store" })
      .then((r) => r.json())
      .then(setCtx)
      .catch(() => setCtx({ email: "", organization: null }));
  }, []);

  // Consulta el resultado del cobro hasta que Wompi responde (máx. ~2 min).
  useEffect(() => {
    if (phase.kind !== "processing") return;
    let tries = 0;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      tries++;
      const r = await fetch(`/api/billing/transactions/${phase.transactionId}`, { cache: "no-store" }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      if (j.status === "APPROVED") return setPhase({ kind: "approved" });
      if (j.status === "DECLINED") return setPhase({ kind: "declined", reason: j.reason || "El pago no fue aprobado." });
      if (tries < 60) setTimeout(tick, 2000);
      else setPhase({ kind: "declined", reason: "Wompi aún no confirma el pago. Si se aprueba, tu plan se activará solo y te llegará la confirmación." });
    };
    const t = setTimeout(tick, 1500);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [phase]);

  const needsOrg = ctx && !ctx.organization;
  const samePlan = ctx?.current && ctx.current.planType === planType && ctx.current.billingCycle === billingCycle;
  const isChange = Boolean(ctx?.current && !samePlan);

  const pay = async (t: TokenizedCard) => {
    setBusy(true);
    setSubmitError(null);
    try {
      const r = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType, billingCycle, organizationName: orgName, ...t }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "No se pudo procesar el pago.");
      if (j.status === "APPROVED") setPhase({ kind: "approved" });
      else if (j.status === "DECLINED") {
        const s = await fetch(`/api/billing/transactions/${j.transactionId}`).then((x) => x.json()).catch(() => ({}));
        setPhase({ kind: "declined", reason: s.reason || "El banco rechazó el pago. Revisa los datos o usa otra tarjeta." });
      } else setPhase({ kind: "processing", transactionId: j.transactionId });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo procesar el pago.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ev-site min-h-[100dvh] bg-ev-paper">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="EthicVoice — inicio">
          <Logo markClassName="h-7 w-auto" />
        </Link>
        <Link href="/pricing" className="text-sm text-ev-mute hover:text-ev-night">
          Ver otros planes
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:pt-12">
        {/* Resumen */}
        <section className="lg:pt-2">
          <p className="ev-label text-ev-moss">{isChange ? "Cambio de plan" : "Contratar plan"}</p>
          <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-ev-night sm:text-[2.5rem]">
            {cfg.displayName}
          </h1>
          <p className="mt-2 text-ev-mute">{cfg.description}</p>

          <div className="mt-8 rounded-2xl border border-ev-line bg-white p-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-ev-mute">{yearly ? "Pago anual" : "Pago mensual"}</span>
              <span className="ev-num text-2xl font-semibold text-ev-night">{cop(priceCop)} COP</span>
            </div>
            <p className="mt-1 text-right text-xs text-ev-haze">Equivale a US$ {priceUsd?.toLocaleString("en-US")} {yearly ? "al año" : "al mes"}</p>
            <ul className="mt-5 space-y-2 border-t border-ev-line pt-5 text-sm text-ev-ink">
              <li className="flex gap-2"><i className="icon-[lucide--check] mt-0.5 size-4 text-ev-moss" aria-hidden />Se renueva automáticamente cada {yearly ? "año" : "mes"} con la misma tarjeta.</li>
              <li className="flex gap-2"><i className="icon-[lucide--check] mt-0.5 size-4 text-ev-moss" aria-hidden />Cancela cuando quieras desde Facturación; conservas el acceso hasta el fin del periodo pagado.</li>
              {isChange && (
                <li className="flex gap-2"><i className="icon-[lucide--check] mt-0.5 size-4 text-ev-moss" aria-hidden />El cambio aplica de inmediato y descontamos los días no usados de tu plan actual.</li>
              )}
            </ul>
          </div>
        </section>

        {/* Pago */}
        <section className="rounded-2xl border border-ev-line bg-white p-6 sm:p-8">
          {phase.kind === "approved" ? (
            <div className="py-6 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ev-signal-wash text-ev-moss">
                <i className="icon-[lucide--check] size-6" aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-ev-night">Pago aprobado</h2>
              <p className="mt-2 text-ev-mute">
                Tu plan {cfg.displayName} ya está activo{ctx?.organization ? ` en ${ctx.organization.name}` : orgName ? ` en ${orgName}` : ""}.
              </p>
              <Link href="/app" className="mt-8 inline-flex h-12 items-center rounded-full bg-ev-night px-7 text-sm font-medium text-white hover:bg-ev-slate">
                Ir a mi panel
              </Link>
            </div>
          ) : phase.kind === "processing" ? (
            <div className="py-10 text-center">
              <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-ev-line border-t-ev-night" />
              <h2 className="mt-5 text-lg font-semibold text-ev-night">Confirmando el pago con tu banco…</h2>
              <p className="mt-2 text-sm text-ev-mute">No cierres esta página. Suele tardar unos segundos.</p>
            </div>
          ) : !ctx || (!acceptance && !acceptanceError) ? (
            <div className="flex justify-center py-16">
              <span className="size-6 animate-spin rounded-full border-2 border-ev-line border-t-ev-night" />
            </div>
          ) : acceptanceError ? (
            <p className="rounded-xl bg-[#FCEEEB] p-4 text-sm text-[#862B1D]">
              {acceptanceError} Escríbenos a <a className="underline" href="mailto:support@ethicvoice.co">support@ethicvoice.co</a>.
            </p>
          ) : ctx.isMemberElsewhere ? (
            <p className="rounded-xl bg-[#FBF0DC] p-4 text-sm text-[#8C5C15]">
              Ya perteneces a una organización en EthicVoice. Solo su administrador puede contratar o cambiar el plan.
            </p>
          ) : samePlan ? (
            <div className="py-6">
              <p className="text-ev-night">Tu organización ya tiene este plan activo.</p>
              <Link href="/app/billing" className="mt-4 inline-block text-sm font-medium text-ev-night underline">
                Ir a Facturación
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-ev-night">
                {phase.kind === "declined" ? "Intenta de nuevo" : "Datos de pago"}
              </h2>
              {phase.kind === "declined" && (
                <p className="mt-3 rounded-xl border border-[#F0B2A6] bg-[#FCEEEB] px-3.5 py-2.5 text-sm text-[#862B1D]">{phase.reason}</p>
              )}
              {needsOrg && (
                <label className="mt-5 block">
                  <span className="mb-1.5 block text-sm font-medium text-ev-night">Nombre de tu organización</span>
                  <input
                    className="h-11 w-full rounded-xl border border-ev-line bg-white px-3.5 text-[15px] text-ev-night outline-none focus:border-ev-night"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ej. Industrias Andinas S.A.S."
                    autoComplete="organization"
                  />
                  <span className="mt-1 block text-xs text-ev-mute">Así lo verán tus colaboradores en el canal de denuncias.</span>
                </label>
              )}
              <div className="mt-5">
                <WompiCardForm
                  acceptance={acceptance!}
                  busy={busy}
                  onTokenized={pay}
                  extraValid={!needsOrg || orgName.trim().length >= 2}
                  submitLabel={`Pagar ${cop(priceCop)} COP`}
                />
              </div>
              {submitError && (
                <p className="mt-4 rounded-xl border border-[#F0B2A6] bg-[#FCEEEB] px-3.5 py-2.5 text-sm text-[#862B1D]">{submitError}</p>
              )}
              {ctx.email && <p className="mt-4 text-center text-xs text-ev-haze">Cobro a nombre de {ctx.email}</p>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
