"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { trackGA4Event } from "@/lib/google-analytics";
import {
  EbookLeadCaptcha,
  type EbookLeadCaptchaHandle,
} from "@/modules/landig-page/components/ebook/EbookLeadCaptcha";

type EbookLeadOkResponse = { error?: string; pdfUrl?: string; success?: boolean };

export type EbookLeadUtm = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

const labelClass = "block text-xs font-bold uppercase tracking-wide text-[#0d212c]";

const fieldClass =
  "mt-2 w-full rounded-xl border-2 border-slate-200/90 bg-white px-4 py-3.5 text-sm font-medium text-[#0d212c] shadow-[inset_0_2px_4px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-lime-500 focus:shadow-[0_0_0_4px_rgba(163,230,53,0.22)]";

const siteKeyConfigured =
  typeof process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY === "string" &&
  process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY.length > 0;

type Props = {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  utm: EbookLeadUtm;
};

export function EbookDownloadLeadModal({ open, onClose, pdfUrl, utm }: Props) {
  const titleId = useId();
  const captchaRef = useRef<EbookLeadCaptchaHandle>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadPdfHref, setDownloadPdfHref] = useState(pdfUrl);

  const reset = useCallback(() => {
    setFullName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setRole("");
    setHcaptchaToken(null);
    captchaRef.current?.reset();
    setStatus("idle");
    setErrorMsg("");
    setDownloadPdfHref(pdfUrl);
  }, [pdfUrl]);

  const handleClose = useCallback(() => {
    if (status === "loading") return;
    onClose();
    reset();
  }, [onClose, reset, status]);

  useEffect(() => {
    if (open) setDownloadPdfHref(pdfUrl);
  }, [open, pdfUrl]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");
      if (siteKeyConfigured && !hcaptchaToken) {
        setErrorMsg("Completa la verificación de seguridad.");
        setStatus("error");
        return;
      }
      setStatus("loading");
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
        const data = (await res.json()) as EbookLeadOkResponse;
        if (!res.ok) {
          setErrorMsg(data.error || "Algo salió mal. Inténtalo de nuevo.");
          setStatus("error");
          captchaRef.current?.reset();
          return;
        }
        if (typeof data.pdfUrl === "string" && data.pdfUrl.length > 0) {
          setDownloadPdfHref(data.pdfUrl);
        }
        trackGA4Event("generate_lead", {
          cta_name: "ebook_guia_canal_denuncias",
          placement: "ebook_download_modal",
        });
        setStatus("success");
      } catch {
        setErrorMsg("Error de red. Revisa tu conexión e inténtalo de nuevo.");
        setStatus("error");
        captchaRef.current?.reset();
      }
    },
    [company, email, fullName, hcaptchaToken, phone, role, utm]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="absolute inset-0 bg-[#051a24]/75 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-[#0d212c] bg-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-[#f7faf9] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-800">EthicVoice</p>
            <h2 id={titleId} className="mt-1 text-lg font-extrabold leading-tight text-[#0d212c] sm:text-xl">
              Descarga la guía gratuita
            </h2>
            <p className="mt-1 text-xs text-slate-600">(Ingresa tus datos y recibe acceso inmediato)</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={status === "loading"}
            className="rounded-full border border-slate-200 bg-white p-2 text-[#0d212c] transition hover:bg-slate-50 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <i className="icon-[lucide--x] h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {status === "success" ? (
            <div className="rounded-2xl border-2 border-lime-300 bg-lime-50/90 px-4 py-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime-400 text-[#052b24]">
                <i className="icon-[lucide--circle-check] h-7 w-7" aria-hidden />
              </span>
              <p className="mt-4 font-bold text-[#052b24]">¡Listo! Gracias por tu interés.</p>
              <p className="mt-2 text-sm text-[#334155]">
                Revisa tu correo corporativo; si no ves el mensaje, mira en spam o promociones.
              </p>
              <a
                href={downloadPdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-5 py-3.5 text-sm font-bold text-[#052b24] shadow-[0_8px_28px_rgba(132,204,22,0.55)] transition hover:from-lime-300 hover:to-lime-400"
              >
                <i className="icon-[lucide--external-link] h-4 w-4" aria-hidden />
                Abrir la guía (PDF)
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 text-sm font-semibold text-[#0d212c] underline underline-offset-2 hover:text-lime-800"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4 md:space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="ev-modal-fullName" className={labelClass}>
                    Nombre completo
                  </label>
                  <input
                    id="ev-modal-fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={200}
                    className={fieldClass}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="ev-modal-phone" className={labelClass}>
                    Teléfono
                  </label>
                  <input
                    id="ev-modal-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={40}
                    inputMode="tel"
                    className={fieldClass}
                    placeholder="+57 …"
                  />
                </div>
                <div>
                  <label htmlFor="ev-modal-email" className={labelClass}>
                    Correo corporativo
                  </label>
                  <input
                    id="ev-modal-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={320}
                    className={fieldClass}
                    placeholder="nombre@empresa.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ev-modal-company" className={labelClass}>
                    Empresa
                  </label>
                  <input
                    id="ev-modal-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    maxLength={200}
                    className={fieldClass}
                    placeholder="Razón social"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="ev-modal-role" className={labelClass}>
                    Cargo
                  </label>
                  <input
                    id="ev-modal-role"
                    name="role"
                    type="text"
                    autoComplete="organization-title"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    maxLength={200}
                    className={fieldClass}
                    placeholder="Ej. Director de cumplimiento"
                  />
                </div>
              </div>

              <EbookLeadCaptcha ref={captchaRef} theme="light" onToken={setHcaptchaToken} />

              {status === "error" && errorMsg ? (
                <p className="rounded-xl border-2 border-red-300/80 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
                  {errorMsg}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-lime-400 via-lime-400 to-lime-500 px-6 py-4 text-sm font-bold uppercase tracking-wide text-[#052b24] shadow-[0_6px_24px_rgba(132,204,22,0.55),0_14px_48px_rgba(163,230,53,0.45),0_3px_12px_rgba(15,23,42,0.15)] transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-[0_8px_28px_rgba(132,204,22,0.65),0_18px_52px_rgba(163,230,53,0.5)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {status === "loading" ? (
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
  );
}
