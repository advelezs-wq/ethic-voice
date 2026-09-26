"use client";

/**
 * Thank-you page de recursos descargables: confirma la descarga, dispara el
 * evento de medición y ofrece el archivo. Permite medir conversiones
 * (visita de landing → lead → descarga) por campaña, y convierte el
 * momento de mayor interés en una invitación a la demo.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { trackGA4Event } from "@/lib/google-analytics";
import { Logo } from "@/modules/brand/components/Logo";
import { Button, Container, RevealHeading, Voice } from "@/modules/brand/components/primitives";
import { RevealController } from "@/modules/brand/components/RevealController";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";

interface Props {
  slug: string;
  title: string;
  campaign: string;
  fileUrl: string;
}

export function ResourceThankYouClient({ slug, title, campaign, fileUrl }: Props) {
  const fired = useRef(false);
  const demo = useDemoCta();

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackGA4Event("resource_download_thankyou", {
      resource_slug: slug,
      campaign,
    });
    // Inicia la descarga automáticamente tras un breve retraso
    const t = setTimeout(() => {
      try {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      } catch {}
    }, 900);
    return () => clearTimeout(t);
  }, [slug, campaign, fileUrl]);

  return (
    <main className="ev-site flex min-h-screen flex-col">
      <RevealController />
      <header className="border-b border-ev-line">
        <Container className="flex h-16 items-center">
          <Link href="/" aria-label="EthicVoice — inicio">
            <Logo markClassName="h-7 w-auto" />
          </Link>
        </Container>
      </header>

      <section className="flex flex-1 items-center py-20">
        <Container>
          <p className="ev-label flex items-center gap-2 text-ev-moss">
            <span className="h-1.5 w-1.5 bg-ev-signal" /> Descarga confirmada
          </p>
          <RevealHeading
            as="h1"
            className="ev-display mt-8 max-w-4xl text-ev-night"
            lines={["Gracias. Tu guía", <>ya está <Voice>en camino.</Voice></>]}
          />
          <p className="ev-lead mt-8 max-w-xl">
            Registramos tu solicitud de <span className="text-ev-night">{title}</span>. La
            descarga comenzará sola; si no inicia, usa el botón.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGA4Event("resource_download_click", { resource_slug: slug, campaign })}
              className="ev-press inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-ev-night px-7 text-base font-medium text-white hover:bg-ev-slate"
            >
              Descargar ahora ↓
            </a>
          </div>

          <div className="mt-24 grid gap-8 border-t border-ev-night pt-10 lg:grid-cols-12">
            <p className="ev-h3 text-ev-night lg:col-span-7">
              Mientras la lees: ¿quieres ver cómo se ve un canal de denuncias
              funcionando con casos de tu industria?
            </p>
            <div className="lg:col-span-4 lg:col-start-9">
              <Button variant="signal" size="lg" arrow onClick={demo("thankyou_demo", `thankyou_${slug}`)}>
                Agendar demo de 30 min
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
