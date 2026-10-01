"use client";

import { useEffect, useState } from "react";

export type Acceptance = {
  acceptanceToken: string;
  acceptancePermalink: string;
  personalAuthToken: string;
  personalAuthPermalink: string;
  publicKey: string;
  sandbox: boolean;
};

export type TokenizedCard = {
  cardToken: string;
  card: { brand?: string; last4?: string; expMonth?: string; expYear?: string };
  acceptanceToken: string;
  personalAuthToken: string;
};

async function fetchAcceptance(): Promise<Acceptance> {
  const r = await fetch("/api/billing/acceptance", { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Los pagos en línea no están disponibles.");
  return j;
}

/** Términos de Wompi + llave pública (necesarios para guardar una tarjeta). */
export function useWompiAcceptance() {
  const [data, setData] = useState<Acceptance | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchAcceptance()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Los pagos en línea no están disponibles."));
  }, []);
  return { acceptance: data, acceptanceError: error };
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const formatNumber = (v: string) => onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExp = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Envía la tarjeta directo a Wompi (nunca pasa por nuestro servidor). */
async function tokenizeCard(publicKey: string, card: { number: string; cvc: string; expMonth: string; expYear: string; holder: string }) {
  const base = publicKey.startsWith("pub_prod_") ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";
  const res = await fetch(`${base}/tokens/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicKey}` },
    body: JSON.stringify({
      number: card.number,
      cvc: card.cvc,
      exp_month: card.expMonth,
      exp_year: card.expYear,
      card_holder: card.holder,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j?.status !== "CREATED") {
    const messages = j?.error?.messages as Record<string, string[]> | undefined;
    const first = messages ? Object.values(messages).flat()[0] : null;
    throw new Error(first ? `Revisa los datos de la tarjeta: ${first}` : "Revisa los datos de la tarjeta.");
  }
  return { id: String(j.data.id), brand: j.data.brand as string, last4: j.data.last_four as string };
}

const input =
  "h-11 w-full rounded-xl border border-ev-line bg-white px-3.5 text-[15px] text-ev-night outline-none transition-colors placeholder:text-ev-haze focus:border-ev-night";

export function WompiCardForm({
  acceptance,
  submitLabel,
  busy,
  onTokenized,
  extraValid = true,
}: {
  acceptance: Acceptance;
  submitLabel: string;
  busy: boolean;
  onTokenized: (t: TokenizedCard) => Promise<void> | void;
  extraValid?: boolean;
}) {
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [terms, setTerms] = useState(false);
  const [dataAuth, setDataAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);

  const digits = onlyDigits(number);
  const [mm, yy] = exp.split("/");
  const valid =
    holder.trim().length >= 3 && digits.length >= 13 && mm?.length === 2 && Number(mm) >= 1 && Number(mm) <= 12 && yy?.length === 2 && cvc.length >= 3 && terms && dataAuth && extraValid;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy || tokenizing) return;
    setError(null);
    setTokenizing(true);
    try {
      const t = await tokenizeCard(acceptance.publicKey, { number: digits, cvc, expMonth: mm, expYear: yy, holder: holder.trim() });
      // Wompi acepta cada token de aceptación una sola vez: sin tokens nuevos,
      // un segundo intento (otra tarjeta tras un rechazo) falla con INPUT_VALIDATION_ERROR.
      const fresh = await fetchAcceptance();
      await onTokenized({
        cardToken: t.id,
        card: { brand: t.brand, last4: t.last4, expMonth: mm, expYear: yy },
        acceptanceToken: fresh.acceptanceToken,
        personalAuthToken: fresh.personalAuthToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la tarjeta.");
    } finally {
      setTokenizing(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {acceptance.sandbox && (
        <p className="rounded-xl bg-[#FBF0DC] px-3.5 py-2.5 text-sm text-[#8C5C15]">
          Modo de prueba: usa la tarjeta <span className="font-mono">4242 4242 4242 4242</span> (aprobada) o{" "}
          <span className="font-mono">4111 1111 1111 1111</span> (rechazada), cualquier fecha futura y CVC.
        </p>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ev-night">Nombre en la tarjeta</span>
        <input className={input} value={holder} onChange={(e) => setHolder(e.target.value)} autoComplete="cc-name" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ev-night">Número de la tarjeta</span>
        <input
          className={`${input} font-mono tracking-wide`}
          value={number}
          onChange={(e) => setNumber(formatNumber(e.target.value))}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ev-night">Vence</span>
          <input className={`${input} font-mono`} value={exp} onChange={(e) => setExp(formatExp(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ev-night">CVC</span>
          <input className={`${input} font-mono`} value={cvc} onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
        </label>
      </div>

      <div className="space-y-2.5 pt-1 text-sm text-ev-mute">
        <label className="flex items-start gap-2.5">
          <input type="checkbox" className="mt-0.5 size-4 accent-[#0B1D21]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            Acepto los{" "}
            <a href={acceptance.acceptancePermalink} target="_blank" rel="noreferrer" className="font-medium text-ev-night underline">
              términos y condiciones de Wompi
            </a>
            .
          </span>
        </label>
        <label className="flex items-start gap-2.5">
          <input type="checkbox" className="mt-0.5 size-4 accent-[#0B1D21]" checked={dataAuth} onChange={(e) => setDataAuth(e.target.checked)} />
          <span>
            Autorizo el{" "}
            <a href={acceptance.personalAuthPermalink} target="_blank" rel="noreferrer" className="font-medium text-ev-night underline">
              tratamiento de mis datos personales
            </a>{" "}
            para guardar la tarjeta y cobrar la suscripción.
          </span>
        </label>
      </div>

      {error && <p className="rounded-xl border border-[#F0B2A6] bg-[#FCEEEB] px-3.5 py-2.5 text-sm text-[#862B1D]">{error}</p>}

      <button
        type="submit"
        disabled={!valid || busy || tokenizing}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ev-night text-sm font-medium text-white transition-[transform,background-color] hover:bg-ev-slate active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {(busy || tokenizing) && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        {submitLabel}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-ev-mute">
        <i className="icon-[lucide--lock] size-3.5" aria-hidden />
        Pago seguro con Wompi (Bancolombia). EthicVoice no ve ni guarda los datos de tu tarjeta.
      </p>
    </form>
  );
}
