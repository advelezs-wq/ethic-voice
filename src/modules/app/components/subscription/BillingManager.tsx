"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button } from "@heroui/react";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { WompiCardForm, useWompiAcceptance, type TokenizedCard } from "@/modules/app/components/checkout/WompiCardForm";

type Summary = {
  canManage: boolean;
  subscription: null | {
    id: number;
    planName: string;
    billingCycle: "MONTHLY" | "YEARLY";
    status: "ACTIVE" | "PAST_DUE" | "INACTIVE" | "TRIALING";
    billing: "wompi" | "manual";
    priceCop: number | null;
    currentPeriodEnd: string | null;
    nextChargeAt: string | null;
    cancelAtPeriodEnd: boolean;
    failedAttempts: number;
    lastError: string | null;
    card: { brand?: string; last4?: string; expMonth?: string; expYear?: string } | null;
  };
  payments: Array<{ id: number; amount: number; currency: string; status: string; gateway: string; transactionDate: string; providerTransactionId: string | null }>;
};

const date = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "—";
const money = (n: number, c: string) => (c === "COP" ? `$ ${n.toLocaleString("es-CO")} COP` : `US$ ${n.toLocaleString("en-US")}`);
const PAY_STATUS: Record<string, { label: string; tone: string }> = {
  SUCCEEDED: { label: "Pagado", tone: "bg-ev-signal-wash text-ev-moss" },
  PENDING: { label: "En proceso", tone: "bg-[#FBF0DC] text-[#8C5C15]" },
  FAILED: { label: "Rechazado", tone: "bg-[#FCEEEB] text-[#862B1D]" },
  REFUNDED: { label: "Reembolsado", tone: "bg-ev-bone text-ev-mute" },
};

function statusOf(s: NonNullable<Summary["subscription"]>) {
  if (s.status === "PAST_DUE") return { label: "Suspendido por falta de pago", tone: "bg-[#FCEEEB] text-[#862B1D]" };
  if (s.status === "INACTIVE") return { label: "Cobro pausado", tone: "bg-[#FBF0DC] text-[#8C5C15]" };
  if (s.cancelAtPeriodEnd) return { label: `Se cancela el ${date(s.currentPeriodEnd)}`, tone: "bg-[#FBF0DC] text-[#8C5C15]" };
  if (s.failedAttempts > 0) return { label: "Pago rechazado · reintentando", tone: "bg-[#FBF0DC] text-[#8C5C15]" };
  return { label: "Activo", tone: "bg-ev-signal-wash text-ev-moss" };
}

export function BillingManager() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"card" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  const { acceptance, acceptanceError } = useWompiAcceptance();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/billing/summary", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error);
      setData(j);
    } catch (e) {
      showError("No se pudo cargar la facturación", e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const post = async (path: string, body?: unknown) => {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "No se pudo completar la operación.");
    return j;
  };

  const waitFor = async (txId: string) => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const j = await fetch(`/api/billing/transactions/${txId}`).then((r) => r.json()).catch(() => ({}));
      if (j.status === "APPROVED") return { ok: true };
      if (j.status === "DECLINED") return { ok: false, reason: j.reason as string };
    }
    return { ok: false, reason: "El banco aún no confirma el pago; te avisaremos cuando se apruebe." };
  };

  const changeCard = async (t: TokenizedCard) => {
    setBusy(true);
    try {
      const j = await post("/api/billing/card", t);
      if (j.retriedTransactionId) {
        const res = await waitFor(j.retriedTransactionId);
        if (res.ok) showSuccess("Tarjeta actualizada y pago aprobado", "Tu plan está activo de nuevo.");
        else showError("Tarjeta guardada, pero el pago no se aprobó", res.reason);
      } else {
        showSuccess("Tarjeta actualizada", "Los próximos cobros se harán a esta tarjeta.");
      }
      setDialog(null);
      await load();
    } catch (e) {
      showError("No se pudo cambiar la tarjeta", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const j = await post("/api/billing/cancel");
      showSuccess("Suscripción cancelada", `Conservas el acceso hasta el ${date(j.accessUntil)}. No habrá más cobros.`);
      setDialog(null);
      await load();
    } catch (e) {
      showError("No se pudo cancelar", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const resume = async () => {
    setBusy(true);
    try {
      await post("/api/billing/resume");
      showSuccess("Suscripción reanudada", "Seguirá renovándose automáticamente.");
      await load();
    } catch (e) {
      showError("No se pudo reanudar", e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-ev-line bg-white p-8 text-sm text-ev-mute">
        <span className="size-4 animate-spin rounded-full border-2 border-ev-line border-t-ev-night" /> Cargando facturación…
      </div>
    );
  }
  if (!data) return null;
  const s = data.subscription;
  const st = s ? statusOf(s) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-ev-line bg-white p-6 sm:p-8">
        {!s ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ev-night">Tu organización no tiene un plan activo</p>
              <p className="mt-1 text-sm text-ev-mute">Elige un plan para recibir denuncias y usar todas las herramientas.</p>
            </div>
            {data.canManage && (
              <Link href="/app/billing/upgrade" className="inline-flex h-11 items-center rounded-full bg-ev-night px-6 text-sm font-medium text-white hover:bg-ev-slate">
                Ver planes
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="ev-label text-ev-mute">Plan actual</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ev-night">{s.planName}</h2>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${st!.tone}`}>{st!.label}</span>
              </div>
              {data.canManage && (
                <Link href="/app/billing/upgrade" className="inline-flex h-10 items-center rounded-full border border-ev-night/20 px-5 text-sm font-medium text-ev-night hover:border-ev-night/50">
                  Cambiar plan
                </Link>
              )}
            </div>

            {s.billing === "manual" ? (
              <p className="mt-6 rounded-xl bg-ev-paper p-4 text-sm text-ev-mute">
                Tu plan está gestionado directamente por el equipo de EthicVoice (contrato o facturación manual). Para cambios en el cobro escríbenos a{" "}
                <a className="underline" href="mailto:support@ethicvoice.co">support@ethicvoice.co</a>.
              </p>
            ) : (
              <dl className="mt-6 grid gap-4 border-t border-ev-line pt-6 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-ev-mute">Valor</dt>
                  <dd className="ev-num mt-1 font-medium text-ev-night">
                    {s.priceCop ? money(s.priceCop, "COP") : "—"} <span className="text-sm font-normal text-ev-mute">/ {s.billingCycle === "YEARLY" ? "año" : "mes"}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-ev-mute">{s.cancelAtPeriodEnd ? "Acceso hasta" : "Próximo cobro"}</dt>
                  <dd className="mt-1 font-medium text-ev-night">{date(s.cancelAtPeriodEnd ? s.currentPeriodEnd : s.nextChargeAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ev-mute">Tarjeta</dt>
                  <dd className="mt-1 font-medium text-ev-night">
                    {s.card?.last4 ? `${s.card.brand ?? "Tarjeta"} •••• ${s.card.last4}` : "—"}
                  </dd>
                </div>
              </dl>
            )}

            {s.billing === "wompi" && (s.status === "PAST_DUE" || s.failedAttempts > 0) && (
              <p className="mt-5 rounded-xl border border-[#F0B2A6] bg-[#FCEEEB] p-4 text-sm text-[#862B1D]">
                {s.status === "PAST_DUE"
                  ? "No pudimos cobrar tu plan después de varios intentos y el acceso quedó suspendido. Actualiza la tarjeta para reactivarlo al instante."
                  : `El último cobro fue rechazado${s.lastError ? ` (${s.lastError})` : ""}. Lo intentaremos de nuevo el ${date(s.nextChargeAt)}; si quieres, cambia la tarjeta ahora.`}
              </p>
            )}

            {data.canManage && s.billing === "wompi" && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="bg-ev-night font-medium text-white" onPress={() => setDialog("card")}>
                  {s.status === "PAST_DUE" ? "Actualizar tarjeta y pagar" : "Cambiar tarjeta"}
                </Button>
                {s.cancelAtPeriodEnd ? (
                  <Button variant="bordered" isLoading={busy} onPress={resume}>
                    Reanudar suscripción
                  </Button>
                ) : (
                  s.status !== "PAST_DUE" && (
                    <Button variant="light" className="text-[#B23A28]" onPress={() => setDialog("cancel")}>
                      Cancelar suscripción
                    </Button>
                  )
                )}
              </div>
            )}
            {!data.canManage && <p className="mt-6 text-sm text-ev-mute">Solo el administrador de la organización puede cambiar el plan o la forma de pago.</p>}
          </>
        )}
      </section>

      <section className="rounded-2xl border border-ev-line bg-white">
        <header className="border-b border-ev-line px-6 py-4">
          <h2 className="font-semibold text-ev-night">Historial de pagos</h2>
        </header>
        {data.payments.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ev-mute">Aún no hay pagos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-ev-mute">
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ev-line">
                {data.payments.map((p) => {
                  const ps = PAY_STATUS[p.status] ?? { label: p.status, tone: "bg-ev-bone text-ev-mute" };
                  return (
                    <tr key={p.id}>
                      <td className="px-6 py-3 text-ev-night">{date(p.transactionDate)}</td>
                      <td className="ev-num px-6 py-3 text-ev-night">{money(p.amount, p.currency)}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ps.tone}`}>{ps.label}</span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-ev-mute">{p.gateway === "WOMPI" ? p.providerTransactionId : "Manual"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal isOpen={dialog === "card"} onClose={() => !busy && setDialog(null)} size="lg" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{s?.status === "PAST_DUE" ? "Actualizar tarjeta y pagar" : "Cambiar tarjeta"}</ModalHeader>
          <ModalBody className="pb-6">
            {acceptance ? (
              <WompiCardForm
                acceptance={acceptance}
                busy={busy}
                onTokenized={changeCard}
                submitLabel={s?.status === "PAST_DUE" && s.priceCop ? `Guardar y pagar ${money(s.priceCop, "COP")}` : "Guardar tarjeta"}
              />
            ) : (
              <p className="text-sm text-ev-mute">{acceptanceError || "Cargando…"}</p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={dialog === "cancel"} onClose={() => !busy && setDialog(null)}>
        <ModalContent>
          <ModalHeader>Cancelar suscripción</ModalHeader>
          <ModalBody>
            <p className="text-sm text-ev-ink">
              No se harán más cobros. Conservas el acceso a {s?.planName} hasta el <strong>{date(s?.currentPeriodEnd ?? null)}</strong>; después la organización queda sin plan y deja de recibir denuncias por los canales pagos. Puedes reanudar antes de esa fecha.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDialog(null)} isDisabled={busy}>
              Volver
            </Button>
            <Button className="bg-ev-coral font-medium text-white" isLoading={busy} onPress={cancel}>
              Cancelar suscripción
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
