"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { trackGA4Event } from "@/lib/google-analytics";
import { cn } from "@heroui/react";
import { EbookDownloadLeadModal } from "@/modules/landig-page/components/ebook/EbookDownloadLeadModal";
import {
  EbookLeadCaptcha,
  type EbookLeadCaptchaHandle,
} from "@/modules/landig-page/components/ebook/EbookLeadCaptcha";
import { resolvePublicEbookPdfUrl } from "@/lib/ebook-public-pdf";

export type EbookUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

const siteKeyConfigured =
  typeof process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY === "string" &&
  process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY.length > 0;

const GOODBYE_ITEMS = [
  "Enterarte del problema cuando ya es demasiado tarde.",
  "Tener un buzón de sugerencias que nadie usa ni nadie gestiona.",
  "Perder reputación, dinero y talento por irregularidades que pudieron prevenirse.",
  'Cumplir la norma "de papel" sin un sistema que realmente funcione.',
] as const;

const DISCOVER_ITEMS = [
  "Por qué el 80% de las irregularidades se detectan por denuncia, no por auditoría y cómo aprovechar eso a tu favor.",
  "El ciclo completo de gestión de una denuncia desde la recepción hasta el cierre del caso con acciones correctivas documentadas.",
  "Qué diferencia a un canal básico de uno que realmente protege a tu organización y por qué un correo electrónico NO es suficiente.",
  "Cómo proteger al denunciante: el pilar que define si las personas usan o ignoran tu canal.",
  "El marco regulatorio que ya te aplica en Colombia (SARLAFT, SAGRILAFT, Ley 2195 de 2022) y Latinoamérica, México, Brasil, Argentina, Chile y Perú: cómo cumplirlo sin complicarte.",
  "El rol que debe jugar la Alta Dirección: porque sin compromiso desde arriba, el sistema no funciona.",
] as const;

const PROOF_BLOCKS = [
  {
    title: "En ética corporativa, es mejor actuar que aparentar.",
    body: "La implementación de un canal de denuncias efectivo ya no es una opción. En Latinoamérica, Colombia, México, Brasil, Argentina, Chile y Perú exigen mecanismos formales de reporte como parte de sus programas de compliance.",
  },
  {
    title: "Las organizaciones que lideran el mercado no son las que nunca enfrentan problemas.",
    body: "Son las que los detectan a tiempo.",
  },
] as const;

/** Países citados en el primer bloque de credibilidad (refuerzo visual). */
const PROOF_REGION_CHIPS = ["Colombia", "México", "Brasil", "Argentina", "Chile", "Perú"] as const;

function EbookGoodbyeSection() {
  return (
    <section
      className="relative overflow-hidden border-t border-slate-200 bg-[#f7faf9] py-16 md:py-20"
      aria-labelledby="ebook-despidete-heading"
    >
      <div
        className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-lime-400/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-[360px] w-[360px] rounded-full bg-[#0d212c]/[0.04] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgb(148_163_184/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.12)_1px,transparent_1px)] [background-size:48px_48px] md:opacity-50"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-700">Haz espacio</p>
          <div className="relative mt-3 inline-block">
            <h2
              id="ebook-despidete-heading"
              className="relative text-balance text-2xl font-extrabold uppercase tracking-tight text-[#0d212c] sm:text-3xl md:text-4xl lg:text-[2.35rem]"
            >
              <span className="relative z-10">&quot;Despídete&quot; de:</span>
            </h2>
            <span
              className="pointer-events-none absolute -bottom-1 left-[8%] right-[8%] h-3 rounded-full bg-lime-400/35 blur-[2px]"
              aria-hidden
            />
          </div>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#64748b]">
            Costumbres que hoy pasan desapercibidas… hasta que explotan. La guía te ayuda a invertir esa historia.
          </p>
        </header>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {GOODBYE_ITEMS.map((item, index) => (
            <article
              key={item}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-4 pr-16 shadow-[0_14px_40px_-18px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-[transform,box-shadow] duration-300 sm:p-5 sm:pr-[4.5rem] md:p-6",
                "hover:-translate-y-1 hover:shadow-[0_22px_48px_-20px_rgba(15,23,42,0.18)]",
                index % 2 === 1 && "sm:translate-y-2 lg:translate-y-4",
                index === 0 && "border-lime-300/40 ring-1 ring-lime-400/15"
              )}
            >
              <span
                className="pointer-events-none absolute -right-2 -top-8 select-none font-black leading-none text-slate-100 transition-colors group-hover:text-lime-100/80 sm:-right-4 sm:-top-10"
                style={{ fontSize: "clamp(4.5rem, 14vw, 7.5rem)" }}
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="relative z-10 flex gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-inner shadow-white/20 ring-2 ring-white/30"
                  aria-hidden
                >
                  <i className="icon-[lucide--x] h-5 w-5" />
                </div>
                <p className="relative pt-0.5 text-left text-sm font-semibold leading-relaxed text-[#1e293b] md:text-[0.95rem]">
                  {item}
                </p>
              </div>

              <div
                className="pointer-events-none absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-gradient-to-b from-red-400 via-rose-500 to-red-600 opacity-90"
                aria-hidden
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function EbookDiscoverSection() {
  return (
    <section
      className="relative overflow-hidden border-t border-lime-500/25 bg-gradient-to-b from-[#051a24] via-[#0d212c] to-[#041018] py-16 md:py-20"
      aria-labelledby="ebook-discover-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_75%_-8%,rgba(163,230,53,0.18),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-0 h-[min(55%,420px)] w-[min(90vw,480px)] rounded-full bg-lime-400/[0.08] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-emerald-500/[0.06] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.03)_50%,transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-400/50 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-400/95">Lo que vas a descubrir</p>
          <h2
            id="ebook-discover-heading"
            className="mt-4 text-balance text-2xl font-extrabold leading-[1.2] tracking-tight text-white md:text-3xl lg:text-[2.05rem]"
          >
            Esto es una fracción de lo que vas a encontrar{" "}
            <span className="relative inline-block text-lime-400">
              en la guía
              <span
                className="pointer-events-none absolute -bottom-1 left-0 right-0 h-2 rounded-full bg-lime-400/25 blur-[1px]"
                aria-hidden
              />
            </span>
            <span className="text-lime-300/90">:</span>
          </h2>
        </header>

        <ol className="mx-auto grid max-w-5xl list-none grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
          {DISCOVER_ITEMS.map((item, index) => (
            <li
              key={item.slice(0, 56)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 md:p-6",
                "hover:-translate-y-0.5 hover:border-lime-400/35 hover:shadow-[0_28px_56px_-20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(163,230,53,0.12)]",
                index % 2 === 1 && "sm:translate-y-3 lg:translate-y-5"
              )}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-lime-400/10 blur-2xl transition-opacity group-hover:opacity-100 group-hover:bg-lime-400/15"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 top-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-lime-400 via-lime-500 to-emerald-600 opacity-90"
                aria-hidden
              />

              <div className="relative z-10 flex gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-400 ring-1 ring-lime-400/25"
                  aria-hidden
                >
                  <i className="icon-[lucide--circle-check] h-5 w-5" />
                </span>
                <p className="text-left text-sm font-medium leading-relaxed text-slate-100/95 md:text-[0.95rem]">
                  <span className="mr-1.5 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-white/10 px-1.5 text-xs font-bold tabular-nums text-lime-300">
                    {index + 1}
                  </span>
                  {item}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function EbookCredibilitySection() {
  const [primary, secondary] = PROOF_BLOCKS;

  return (
    <section
      className="relative overflow-hidden border-t border-emerald-200/50 bg-gradient-to-b from-[#e8f5ec] via-[#f4faf6] to-white py-16 md:py-20"
      aria-labelledby="ebook-cred-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_15%_-5%,rgba(163,230,53,0.2),transparent_58%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(13,33,44,0.06),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgb(100_116_139/0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgb(100_116_139/0.07)_1px,transparent_1px)] [background-size:52px_52px] md:opacity-[0.28]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <header className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-700">Credibilidad</p>
          <h2
            id="ebook-cred-heading"
            className="mt-3 text-balance text-2xl font-extrabold tracking-tight text-[#0d212c] md:text-3xl lg:text-[2rem]"
          >
            Lo que respalda esta guía
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#64748b]">
            Marco regional y criterio de dirección, en dos lecturas breves.
          </p>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-8">
          <article className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_28px_64px_-32px_rgba(15,23,42,0.18)] lg:col-span-7">
            <div
              className="h-1.5 w-full bg-gradient-to-r from-lime-400 via-emerald-500 to-[#0d212c]"
              aria-hidden
            />
            <div className="flex flex-1 flex-col gap-6 p-6 md:flex-row md:items-start md:gap-8 md:p-8">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#051a24] text-lime-400 shadow-[0_12px_28px_-8px_rgba(163,230,53,0.35)] ring-1 ring-white/10"
                aria-hidden
              >
                <i className="icon-[lucide--shield-check] h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold leading-snug text-[#0d212c] md:text-xl">{primary.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#334155] md:text-base">{primary.body}</p>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Mercados mencionados">
                  {PROOF_REGION_CHIPS.map((label) => (
                    <li
                      key={label}
                      className="rounded-full border border-lime-200/90 bg-gradient-to-b from-lime-50 to-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#166534] shadow-sm"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-lime-400/40 bg-gradient-to-br from-[#051a24] via-[#0d212c] to-[#041018] p-6 text-white shadow-[0_32px_64px_-28px_rgba(5,26,36,0.5)] md:p-8 lg:col-span-5">
            <div
              className="pointer-events-none absolute -right-2 top-6 font-serif text-[5.5rem] leading-none text-lime-400/[0.12] md:text-[6.5rem]"
              aria-hidden
            >
              “
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(163,230,53,0.12),transparent_50%)]" aria-hidden />
            <div className="relative z-10 flex flex-1 flex-col gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/30"
                aria-hidden
              >
                <i className="icon-[lucide--trending-up] h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold leading-snug text-white md:text-lg">{secondary.title}</h3>
                <p className="mt-4 text-pretty text-lg font-semibold leading-relaxed text-lime-50 md:text-xl">
                  {secondary.body}
                </p>
              </div>
            </div>
            <p className="relative z-10 mt-8 border-t border-white/10 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/85">
              EthicVoice × Valor Estratégico
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function EbookMidCtaSection({ onRequestDownload }: { onRequestDownload: () => void }) {
  return (
    <section
      className="relative overflow-hidden border-t border-lime-400/25 bg-gradient-to-b from-[#ecfdf3] via-white to-[#f0fdf9] py-16 md:py-20"
      aria-labelledby="ebook-mid-cta-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(163,230,53,0.2),transparent_50%),radial-gradient(ellipse_45%_40%_at_100%_100%,rgba(13,33,44,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(to_right,rgb(148_163_184/0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.1)_1px,transparent_1px)] [background-size:40px_40px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="text-center lg:col-span-7 lg:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-800/90">La pregunta incómoda</p>
            <h2
              id="ebook-mid-cta-heading"
              className="mt-3 text-balance text-2xl font-extrabold leading-tight tracking-tight text-[#0d212c] md:text-3xl lg:text-[2.1rem]"
            >
              ¿Tienes un{" "}
              <span className="bg-gradient-to-r from-lime-600 to-emerald-700 bg-clip-text text-transparent">
                canal de denuncias
              </span>{" "}
              o solo tienes un buzón?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#334155] md:text-base lg:mx-0">
              Hay una diferencia enorme. Esta guía te explica exactamente cuál es y cómo pasar de uno al otro.
            </p>

            <div className="mx-auto mt-8 flex max-w-md flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:mx-0 lg:max-w-none">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border-2 border-lime-400/50 bg-gradient-to-br from-lime-50 to-white px-4 py-3 shadow-[0_12px_32px_-16px_rgba(163,230,53,0.35)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#051a24] text-lime-400">
                  <i className="icon-[lucide--shield-check] h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lime-800">Canal</p>
                  <p className="text-xs font-semibold text-[#0d212c]">Gestión, trazabilidad y protección real</p>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/90 px-4 py-3 shadow-inner">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  <i className="icon-[lucide--inbox] h-5 w-5" aria-hidden />
                </span>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Buzón</p>
                  <p className="text-xs font-medium text-slate-600">Sin dueño ni seguimiento</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-4 sm:mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center lg:mx-0 lg:max-w-none lg:justify-start">
              <button
                type="button"
                onClick={onRequestDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#052b24] shadow-[0_6px_24px_rgba(132,204,22,0.55),0_14px_44px_rgba(163,230,53,0.35)] transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-[0_8px_28px_rgba(132,204,22,0.65),0_18px_52px_rgba(163,230,53,0.42)] active:scale-[0.99] sm:w-auto sm:px-8 sm:py-4"
              >
                <i className="icon-[lucide--download] h-5 w-5 shrink-0" aria-hidden />
                Descargar gratis ahora
              </button>
              <span className="hidden text-sm font-medium text-[#64748b] sm:inline">PDF · acceso inmediato</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <figure className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_56px_-28px_rgba(15,23,42,0.12)] backdrop-blur-sm md:p-8">
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lime-400/15 blur-3xl"
                aria-hidden
              />
              <blockquote className="relative text-pretty text-sm italic leading-relaxed text-[#475569] md:text-base">
                <span className="mb-2 block font-serif text-4xl leading-none text-lime-600/40" aria-hidden>
                  “
                </span>
                Lo que tardaste en leer esto, alguien en tu organización pudo haber reportado algo importante… si
                tuviera dónde hacerlo.
              </blockquote>
              <figcaption className="relative mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs font-semibold uppercase tracking-wide text-lime-800">
                <i className="icon-[lucide--clock-3] h-4 w-4 shrink-0" aria-hidden />
                Cada minuto cuenta
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Primera página del PDF exportada a `/public/ebook/guia-portada.jpg` (ver script en repo: pdftoppm). */
const EBOOK_COVER_PATH = "/ebook/guia-portada.jpg";
const EBOOK_COVER_W = 1275;
const EBOOK_COVER_H = 1650;

function EbookHeroVisual({ onCoverClick }: { onCoverClick: () => void }) {
  const envSrc = process.env.NEXT_PUBLIC_EBOOK_COVER_IMAGE_URL;
  const src = envSrc || EBOOK_COVER_PATH;
  const isRemote = src.startsWith("http");

  return (
    <figure
      className="relative mx-auto w-full max-w-[min(100%,280px)] sm:max-w-[min(100%,380px)] lg:max-w-[min(100%,480px)]"
      aria-label="Portada 3D de la guía en PDF — EthicVoice × Valor Estratégico"
    >
      <button
        type="button"
        onClick={onCoverClick}
        className="relative mx-auto block w-full cursor-pointer border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2"
        aria-label="Abrir formulario para descargar la guía PDF"
      >
      <div className="relative mx-auto [perspective:2000px] [perspective-origin:52%_32%]">
        <div className="group relative mx-auto w-fit [transform-style:preserve-3d] transition-transform duration-700 ease-out will-change-transform [transform:rotateY(-22deg)_rotateX(6deg)] group-hover:[transform:rotateY(-14deg)_rotateX(4deg)]">
          {/* Lomo del libro (cara lateral izquierda) */}
          <div
            className="pointer-events-none absolute top-[5%] bottom-[5%] z-0 w-[18px] rounded-l-md bg-gradient-to-b from-[#020608] via-[#0d212c] to-[#020608] shadow-[inset_-8px_0_14px_rgba(0,0,0,0.55)]"
            style={{
              left: 0,
              transform: "translateX(-15px) rotateY(-90deg)",
              transformOrigin: "right center",
            }}
          />

          {/* Cantos / grosor de páginas (cara lateral derecha) */}
          <div
            className="pointer-events-none absolute top-[6%] bottom-[6%] z-0 w-[14px] rounded-r-[2px] bg-gradient-to-b from-slate-50 via-slate-200 to-slate-400 shadow-[inset_2px_0_6px_rgba(255,255,255,0.5)]"
            style={{
              right: 0,
              transform: "translateX(12px) rotateY(90deg)",
              transformOrigin: "left center",
            }}
          />

          <div className="relative z-10 overflow-hidden rounded-r-2xl rounded-l-[3px] bg-white shadow-[20px_36px_60px_-12px_rgba(15,23,42,0.55),-6px_0_28px_-8px_rgba(163,230,53,0.14),inset_12px_0_32px_-14px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/20">
            <Image
              src={src}
              alt="Portada: Guía práctica para implementar un canal de denuncias efectivo"
              width={EBOOK_COVER_W}
              height={EBOOK_COVER_H}
              className="h-auto w-full max-w-[260px] object-cover object-left-top sm:max-w-[320px] md:max-w-[360px] lg:max-w-[410px]"
              sizes="(max-width: 640px) 75vw, (max-width: 1024px) 40vw, 410px"
              priority
              unoptimized={isRemote}
            />
          </div>
        </div>
      </div>
      {/* Sombra de contacto con el “suelo” */}
      <div
        className="pointer-events-none mx-auto mt-2 h-10 w-[min(78%,260px)] rounded-[50%] bg-[#0d212c]/[0.22] blur-2xl sm:mt-3 sm:h-12 sm:w-[min(78%,320px)] md:w-[min(78%,360px)] lg:w-[min(78%,410px)]"
        aria-hidden
      />
      </button>
    </figure>
  );
}

type Props = {
  utm: EbookUtm;
};

export function EbookCanalLandingPage({ utm }: Props) {
  const leadCaptchaRef = useRef<EbookLeadCaptchaHandle>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [leadErrorMsg, setLeadErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState(resolvePublicEbookPdfUrl);

  const openDownloadModal = useCallback(() => {
    setDownloadModalOpen(true);
  }, []);

  const onSubmitLead = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLeadErrorMsg("");
      if (siteKeyConfigured && !hcaptchaToken) {
        setLeadErrorMsg("Completa la verificación de seguridad.");
        setLeadStatus("error");
        return;
      }
      setLeadStatus("loading");
      try {
        const res = await fetch("/api/public/ebook-lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            company: company.trim(),
            role: role.trim(),
            hcaptchaToken: hcaptchaToken ?? undefined,
            campaign: "guia_canal_denuncias",
            sourcePath: typeof window !== "undefined" ? window.location.pathname : undefined,
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign,
            utmContent: utm.utmContent,
            utmTerm: utm.utmTerm,
          }),
        });
        const data = (await res.json()) as { error?: string; pdfUrl?: string };
        if (!res.ok) {
          setLeadErrorMsg(data.error || "Algo salió mal. Inténtalo de nuevo.");
          setLeadStatus("error");
          leadCaptchaRef.current?.reset();
          return;
        }
        if (typeof data.pdfUrl === "string" && data.pdfUrl.length > 0) {
          setPdfUrl(data.pdfUrl);
        }
        trackGA4Event("generate_lead", {
          cta_name: "ebook_guia_canal_denuncias",
          placement: "ebook_landing",
        });
        setLeadStatus("success");
      } catch {
        setLeadErrorMsg("Error de red. Revisa tu conexión e inténtalo de nuevo.");
        setLeadStatus("error");
        leadCaptchaRef.current?.reset();
      }
    },
    [company, email, fullName, hcaptchaToken, phone, role, utm]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <EbookDownloadLeadModal
        open={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        pdfUrl={pdfUrl}
        utm={utm}
      />
      <div className="border-b border-lime-400/40 bg-[#051a24] px-4 py-3 text-center sm:px-6 sm:py-3.5">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold leading-snug text-white sm:text-base">
            Descarga la{" "}
            <span className="text-lime-300">Guía Práctica para Implementar un Canal de Denuncias Efectivo</span>
          </p>
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-lime-200/90 sm:text-[11px] sm:tracking-[0.18em]">
            EthicVoice × Valor Estratégico
          </p>
        </div>
      </div>

      <section className="relative overflow-hidden bg-white px-4 pb-14 pt-8 sm:px-6 md:px-8 md:pb-20 md:pt-14">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_85%_15%,rgba(163,230,53,0.14)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-lime-700 lg:mb-1 lg:text-left">
            Recurso gratuito · PDF
          </p>

          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-12">
            <div className="order-1 flex flex-col text-center lg:text-left">
              <h1 className="text-balance">
                <span className="block text-[clamp(1.25rem,4.2vw+0.35rem,1.875rem)] font-extrabold leading-[1.2] tracking-tight text-lime-600 sm:text-3xl lg:text-[2.125rem]">
                  Tu empresa tiene riesgos que nadie está reportando.
                </span>
                <span className="mt-2 block text-[clamp(1.25rem,4.2vw+0.35rem,1.875rem)] font-extrabold leading-[1.2] tracking-tight text-[#0d212c] sm:text-3xl lg:text-[2.125rem]">
                  Eso tiene solución.
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-pretty text-sm font-medium leading-relaxed text-[#273c46] sm:text-base lg:mx-0">
                Descarga gratis la Guía Práctica para implementar un canal de denuncias efectivo y aprende cómo detectar
                fraude, corrupción y conductas indebidas antes de que se conviertan en una crisis.
              </p>

              <div className="mt-7 flex justify-center lg:hidden">
                <EbookHeroVisual onCoverClick={openDownloadModal} />
              </div>

              <div className="mt-8 flex w-full justify-center lg:mt-10 lg:justify-start">
                <button
                  type="button"
                  onClick={openDownloadModal}
                  className="w-full max-w-md rounded-full border-0 bg-lime-400 px-5 py-3.5 text-center shadow-[0_4px_16px_rgba(132,204,22,0.55),0_10px_40px_rgba(163,230,53,0.55),0_22px_56px_-10px_rgba(190,242,100,0.4),0_3px_12px_rgba(15,23,42,0.14)] transition-[color,box-shadow] hover:bg-lime-500 hover:shadow-[0_6px_22px_rgba(132,204,22,0.65),0_14px_48px_rgba(163,230,53,0.6),0_28px_64px_-8px_rgba(217,249,157,0.45),0_4px_14px_rgba(15,23,42,0.16)] sm:w-auto sm:max-w-none sm:px-10 sm:py-3.5 lg:min-w-[280px]"
                >
                  <span className="block text-sm font-bold uppercase tracking-wide text-[#052b24]">Descargar gratis</span>
                  <span className="mt-1 block px-1 text-xs font-medium normal-case leading-snug text-[#052b24]/85 sm:px-0">
                    (Obtén gratis lo que te costaría millones en riesgo y reputación)
                  </span>
                </button>
              </div>

              <ul className="mt-5 list-none">
                <li className="text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#14532d] sm:text-xs lg:text-left">
                  100% privacidad. No jugamos. No hacemos spam.
                </li>
              </ul>
            </div>

            <div className="order-2 hidden lg:block lg:pl-4">
              <EbookHeroVisual onCoverClick={openDownloadModal} />
            </div>
          </div>
        </div>
      </section>

      <EbookGoodbyeSection />

      <EbookDiscoverSection />

      <EbookCredibilitySection />

      <section
        id="descargar"
        className="relative scroll-mt-6 overflow-x-clip overflow-y-visible border-t border-lime-400/20 bg-gradient-to-b from-[#051a24] via-[#0a1f2c] to-[#041018] py-14 sm:py-16 md:py-24"
        aria-labelledby="ebook-download-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_60%_at_50%_120%,rgba(163,230,53,0.22),transparent_55%),radial-gradient(ellipse_50%_45%_at_10%_20%,rgba(163,230,53,0.12),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.04)_50%,transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(90%,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-lime-400/60 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="grid items-stretch gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12 lg:gap-x-14">
            <div className="flex flex-col justify-center text-center lg:col-span-5 lg:text-left">
              <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-lime-400/35 bg-lime-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-lime-300 lg:mx-0">
                <i className="icon-[lucide--file-down] h-3.5 w-3.5" aria-hidden />
                PDF gratuito
              </span>
              <h2
                id="ebook-download-heading"
                className="mt-5 text-balance text-2xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.35rem]"
              >
                Descarga la guía{" "}
                <span className="bg-gradient-to-r from-lime-300 to-lime-500 bg-clip-text text-transparent">gratuita</span>{" "}
                ahora
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300/95 md:text-base lg:mx-0">
                (Ingresa tus datos y recibe acceso inmediato al PDF — sin costo ni compromiso.)
              </p>
              <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm font-medium text-slate-200/95 lg:mx-0">
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lime-400/20 text-lime-400">
                    <i className="icon-[lucide--zap] h-3.5 w-3.5" aria-hidden />
                  </span>
                  Contenido accionable: canal de denuncias, compliance y ALTA dirección.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lime-400/20 text-lime-400">
                    <i className="icon-[lucide--globe-2] h-3.5 w-3.5" aria-hidden />
                  </span>
                  Marco Colombia y referencia LATAM en un solo recurso.
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-lime-400/20 text-lime-400">
                    <i className="icon-[lucide--shield-check] h-3.5 w-3.5" aria-hidden />
                  </span>
                  100% privado. Sin spam. Solo valor.
                </li>
              </ul>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div
                  className="pointer-events-none absolute -inset-2 rounded-[1.75rem] bg-gradient-to-br from-lime-400/25 via-lime-500/10 to-transparent opacity-80 blur-2xl sm:-inset-3 sm:rounded-[2rem] md:-inset-4 md:rounded-[2.25rem]"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-2xl border-2 border-white/20 bg-white/[0.97] p-5 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl ring-1 ring-lime-400/30 sm:rounded-3xl sm:p-7 md:p-8 lg:p-9">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-lime-400 via-emerald-400 to-[#0d212c]"
                    aria-hidden
                  />

                  {leadStatus === "success" ? (
                    <div className="mt-6 rounded-2xl border-2 border-lime-300/80 bg-gradient-to-br from-lime-50 to-white px-5 py-8 text-center shadow-inner shadow-lime-100/50">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400 text-[#052b24] shadow-lg shadow-lime-500/30">
                        <i className="icon-[lucide--party-popper] h-7 w-7" aria-hidden />
                      </span>
                      <p className="mt-5 text-lg font-bold text-[#052b24]">¡Listo! Gracias por tu interés.</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#273c46]">
                        Revisa tu correo corporativo; si no ves el mensaje, revisa spam o promociones.
                      </p>
                      {pdfUrl ? (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-6 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_8px_28px_rgba(132,204,22,0.55)] transition hover:from-lime-300 hover:to-lime-400"
                        >
                          <i className="icon-[lucide--external-link] h-4 w-4" aria-hidden />
                          Abrir la guía (PDF)
                        </a>
                      ) : null}
                      <Link
                        href="/"
                        className="mt-5 inline-block text-sm font-semibold text-[#0d212c] underline underline-offset-2 hover:text-lime-800"
                      >
                        Volver al inicio de EthicVoice
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={onSubmitLead} className="mt-6 space-y-4 md:space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label htmlFor="ev-fullName" className="block text-xs font-bold uppercase tracking-wide text-[#0d212c]">
                            Nombre completo
                          </label>
                          <input
                            id="ev-fullName"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            maxLength={200}
                            className="mt-2 w-full rounded-xl border-2 border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-[#0d212c] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.22)]"
                            placeholder="Tu nombre"
                          />
                        </div>
                        <div>
                          <label htmlFor="ev-phone" className="block text-xs font-bold uppercase tracking-wide text-[#0d212c]">
                            Teléfono
                          </label>
                          <input
                            id="ev-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={40}
                            inputMode="tel"
                            className="mt-2 w-full rounded-xl border-2 border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-[#0d212c] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.22)]"
                            placeholder="+57 …"
                          />
                        </div>
                        <div>
                          <label htmlFor="ev-email" className="block text-xs font-bold uppercase tracking-wide text-[#0d212c]">
                            Correo corporativo
                          </label>
                          <input
                            id="ev-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            maxLength={320}
                            className="mt-2 w-full rounded-xl border-2 border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-[#0d212c] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.22)]"
                            placeholder="nombre@empresa.com"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="ev-company" className="block text-xs font-bold uppercase tracking-wide text-[#0d212c]">
                            Empresa
                          </label>
                          <input
                            id="ev-company"
                            name="company"
                            type="text"
                            autoComplete="organization"
                            required
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            maxLength={200}
                            className="mt-2 w-full rounded-xl border-2 border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-[#0d212c] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.22)]"
                            placeholder="Razón social"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="ev-role" className="block text-xs font-bold uppercase tracking-wide text-[#0d212c]">
                            Cargo
                          </label>
                          <input
                            id="ev-role"
                            name="role"
                            type="text"
                            autoComplete="organization-title"
                            required
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            maxLength={200}
                            className="mt-2 w-full rounded-xl border-2 border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-[#0d212c] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.22)]"
                            placeholder="Ej. Director de cumplimiento"
                          />
                        </div>
                      </div>

                      <EbookLeadCaptcha ref={leadCaptchaRef} theme="light" onToken={setHcaptchaToken} />

                      {leadStatus === "error" && leadErrorMsg ? (
                        <p
                          className="rounded-xl border-2 border-red-300/80 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 shadow-sm"
                          role="alert"
                        >
                          {leadErrorMsg}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={leadStatus === "loading"}
                        className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-lime-400 via-lime-400 to-lime-500 px-6 py-4 text-sm font-bold uppercase tracking-wide text-[#052b24] shadow-[0_6px_24px_rgba(132,204,22,0.55),0_14px_48px_rgba(163,230,53,0.45),0_3px_12px_rgba(15,23,42,0.15)] transition-[transform,box-shadow] before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/25 hover:scale-[1.02] hover:shadow-[0_8px_28px_rgba(132,204,22,0.65),0_18px_52px_rgba(163,230,53,0.5)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
                      >
                        {leadStatus === "loading" ? (
                          <>
                            <i className="icon-[lucide--loader-circle] h-5 w-5 shrink-0 animate-spin" aria-hidden />
                            Enviando…
                          </>
                        ) : (
                          <>
                            <i className="icon-[lucide--download] h-5 w-5 shrink-0" aria-hidden />
                            Quiero descargar la guía gratis
                          </>
                        )}
                      </button>
                      <p className="flex items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-wide text-[#475569]">
                        <i className="icon-[lucide--lock] h-4 w-4 shrink-0 text-lime-600" aria-hidden />
                        <span>Obtén gratis algo que te costaría millones</span>
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EbookMidCtaSection onRequestDownload={openDownloadModal} />

      <section className="relative overflow-hidden border-t border-lime-400/35 bg-gradient-to-b from-[#051a24] via-[#0d212c] to-[#041018] px-4 py-14 sm:px-6 md:px-8 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(163,230,53,0.16),transparent_50%),radial-gradient(ellipse_45%_50%_at_100%_80%,rgba(163,230,53,0.08),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-lime-400/[0.04]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-px w-[min(92%,640px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-lime-400/55 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-3xl px-1 text-center sm:px-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-400/95">Cierre</p>
          <h2 className="mt-4 text-balance text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            ¿Llegaste hasta aquí?
          </h2>
          <p className="mt-3 text-base font-semibold text-lime-100/95 sm:text-lg">Entonces ya sabes que necesitas esto.</p>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-200/90 md:text-base">
            Esta guía reúne los estándares internacionales, el marco regulatorio latinoamericano y las mejores prácticas
            en gestión de canales de denuncia — en un recurso práctico, gratuito y listo para aplicar.
          </p>
          <button
            type="button"
            onClick={openDownloadModal}
            className="mx-auto mt-10 flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-6 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_6px_24px_rgba(132,204,22,0.5),0_14px_44px_rgba(163,230,53,0.35)] transition-[transform,box-shadow,filter] hover:scale-[1.02] hover:shadow-[0_8px_28px_rgba(132,204,22,0.55),0_18px_52px_rgba(163,230,53,0.42)] hover:brightness-[1.03] active:scale-[0.99] sm:w-auto sm:max-w-none sm:px-8 sm:py-4"
          >
            Descargar la guía gratis
            <i className="icon-[lucide--arrow-up] h-4 w-4" aria-hidden />
          </button>
          <p className="mx-auto mt-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-lime-200/90 md:text-sm">
            <i className="icon-[lucide--shield-check] h-4 w-4 text-lime-400" aria-hidden />
            100% privado. Sin spam. Solo valor.
          </p>
        </div>
      </section>
    </div>
  );
}
