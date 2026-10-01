"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Switch } from "@heroui/react";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { readableForeground } from "@/modules/core/utils/org-branding";
import { LogoUploadSection } from "./LogoUploadSection";

type Caps = { logo: boolean; color: boolean; whiteLabel: boolean; customDomain: boolean };
type Loaded = {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  whiteLabel?: boolean;
  customDomain?: string;
  _branding: Caps;
  _planInfo: { planType: string };
};

const PRESETS = ["#0B1D21", "#1D4ED8", "#0F766E", "#B91C1C", "#7C3AED", "#C2410C", "#15803D", "#334155"];
const HEX = /^#[0-9a-f]{6}$/i;

function Locked({ plan }: { plan: string }) {
  return (
    <span className="ml-2 inline-flex rounded-full bg-ev-bone px-2 py-0.5 text-[11px] font-medium text-ev-mute">
      Desde {plan}
    </span>
  );
}

/**
 * Marca del canal de denuncias: lo que ven los colaboradores en el formulario
 * y en el seguimiento del caso. Cada opción se habilita según el plan.
 */
export function ChannelBrandingSection({ organizationId }: { organizationId: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [color, setColor] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/organization/${organizationId}/settings`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Loaded) => {
        setData(j);
        const c = j.primaryColor && j.primaryColor.toLowerCase() !== "#0066cc" ? j.primaryColor.toUpperCase() : "";
        setColor(c);
        setWhiteLabel(Boolean(j.whiteLabel));
        setDomain(String(j.customDomain || ""));
      })
      .catch(() => showError("No se pudo cargar la configuración"));
  }, [organizationId]);

  if (!data) return <p className="text-sm text-ev-mute">Cargando…</p>;
  const caps = data._branding;
  const accent = caps.color && HEX.test(color) ? color : "#0B1D21";
  const fg = readableForeground(accent);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (caps.color) body.primaryColor = HEX.test(color) ? color : null;
      if (caps.whiteLabel) body.whiteLabel = whiteLabel;
      if (caps.customDomain) body.customDomain = domain.trim();
      const r = await fetch(`/api/organization/${organizationId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "No se pudo guardar");
      showSuccess("Marca del canal actualizada", "Los cambios ya se ven en tu formulario de denuncias.");
    } catch (e) {
      showError("No se pudo guardar", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        <section>
          <h4 className="font-medium text-ev-night">Logo</h4>
          <p className="mb-3 text-sm text-ev-mute">Aparece en el formulario de denuncias, en el seguimiento del caso y en los reportes PDF.</p>
          <LogoUploadSection organizationId={organizationId} />
        </section>

        <section className="border-t border-ev-line pt-6">
          <h4 className="font-medium text-ev-night">
            Color de marca {!caps.color && <Locked plan="Grow" />}
          </h4>
          <p className="mb-3 text-sm text-ev-mute">Se usa en los botones y acentos del canal de denuncias.</p>
          <div className={`flex flex-wrap items-center gap-2 ${!caps.color ? "pointer-events-none opacity-40" : ""}`}>
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Usar ${c}`}
                onClick={() => setColor(c)}
                className={`size-8 rounded-full ring-offset-2 transition-transform active:scale-95 ${color === c ? "ring-2 ring-ev-night" : ""}`}
                style={{ background: c }}
              />
            ))}
            <label className="ml-2 flex items-center gap-2 rounded-full border border-ev-line px-3 py-1.5 text-sm">
              <input type="color" value={HEX.test(color) ? color : "#0B1D21"} onChange={(e) => setColor(e.target.value.toUpperCase())} className="size-5 cursor-pointer border-0 bg-transparent p-0" />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                placeholder="#RRGGBB"
                className="w-20 bg-transparent font-mono text-ev-night outline-none"
                maxLength={7}
              />
            </label>
            {color && (
              <button type="button" onClick={() => setColor("")} className="text-sm text-ev-mute underline">
                Usar el de EthicVoice
              </button>
            )}
          </div>
        </section>

        <section className="border-t border-ev-line pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-ev-night">
                Marca blanca {!caps.whiteLabel && <Locked plan="Grow Pro" />}
              </h4>
              <p className="text-sm text-ev-mute">El canal muestra solo tu marca: sin el logo ni los enlaces de EthicVoice.</p>
            </div>
            <Switch isSelected={whiteLabel} onValueChange={setWhiteLabel} isDisabled={!caps.whiteLabel} aria-label="Marca blanca" />
          </div>
        </section>

        <section className="border-t border-ev-line pt-6">
          <h4 className="font-medium text-ev-night">
            Dominio propio {!caps.customDomain && <Locked plan="Premium" />}
          </h4>
          <p className="mb-3 text-sm text-ev-mute">Tu canal en una dirección de tu empresa, por ejemplo <span className="font-mono">denuncias.tuempresa.com</span>.</p>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value.trim().toLowerCase())}
            disabled={!caps.customDomain}
            placeholder="denuncias.tuempresa.com"
            className="h-11 w-full max-w-md rounded-xl border border-ev-line px-3.5 font-mono text-sm outline-none focus:border-ev-night disabled:opacity-40"
          />
          {caps.customDomain && domain && (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ev-mute">
              <li>
                En el DNS de tu empresa, crea un registro <span className="font-mono">CNAME</span> de <span className="font-mono">{domain}</span> hacia{" "}
                <span className="font-mono">cname.vercel-dns.com</span>.
              </li>
              <li>
                Escríbenos a <a className="underline" href="mailto:support@ethicvoice.co">support@ethicvoice.co</a> para activarlo; te confirmamos cuando el certificado esté listo.
              </li>
            </ol>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-ev-line pt-6">
          <Button className="bg-ev-night font-medium text-white" isLoading={saving} onPress={save}>
            Guardar cambios
          </Button>
          <Link href={`/submit/${data.slug}`} target="_blank" className="text-sm font-medium text-ev-night underline">
            Ver mi canal de denuncias
          </Link>
        </div>
      </div>

      {/* Vista previa */}
      <aside className="h-fit rounded-2xl border border-ev-line bg-ev-paper p-4 lg:sticky lg:top-6">
        <p className="ev-label mb-3 text-ev-mute">Vista previa del canal</p>
        <div className="overflow-hidden rounded-xl border border-ev-line bg-white">
          <div className="flex items-center gap-2 border-b border-ev-line px-4 py-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="" className="h-7 w-auto max-w-[96px] object-contain" />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-md text-xs font-semibold" style={{ background: accent, color: fg }}>
                {data.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-sm font-medium text-ev-night">{caps.whiteLabel && whiteLabel ? data.name : "EthicVoice"}</span>
          </div>
          <div className="space-y-3 p-4">
            <p className="text-base font-semibold text-ev-night">Línea ética de {data.name}</p>
            <div className="h-2 rounded-full bg-ev-bone">
              <div className="h-2 w-1/3 rounded-full" style={{ background: accent }} />
            </div>
            <div className="h-8 rounded-lg border border-ev-line" />
            <div className="h-8 rounded-lg border border-ev-line" />
            <div className="flex h-10 items-center justify-center rounded-lg text-sm font-medium" style={{ background: accent, color: fg }}>
              Enviar denuncia
            </div>
          </div>
          <p className="border-t border-ev-line px-4 py-2 text-center text-[11px] text-ev-mute">
            {caps.whiteLabel && whiteLabel ? `Canal confidencial de ${data.name}` : "Operado por EthicVoice"}
          </p>
        </div>
        <p className="mt-3 text-xs text-ev-mute">Plan actual: {data._planInfo.planType.replace("_", " ")}</p>
      </aside>
    </div>
  );
}
