"use client";

import { Button, ButtonLink } from "@/modules/brand/components/primitives";
import { StatusScreen } from "@/modules/brand/components/StatusScreen";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Error en la aplicación:", error);
    
    // TODO: En producción, aquí se podría enviar el error a un servicio de monitoreo
    // como Sentry, LogRocket, etc.
  }, [error]);

  return (
    <StatusScreen
      code="Error"
      title={
        <>
          Algo salió <em className="ev-serif pr-[0.06em]">mal.</em>
        </>
      }
      body={
        <>
          Lamentamos el inconveniente. Tu información está a salvo; intenta de
          nuevo en unos segundos.
          {process.env.NODE_ENV === "development" && error.message ? (
            <span className="mt-4 block rounded-lg bg-[#FBE6E1] p-3 font-mono text-xs text-[#7A2415]">
              {error.message}
            </span>
          ) : null}
        </>
      }
      actions={
        <>
          <Button variant="ink" size="lg" onClick={reset}>
            Intentar nuevamente
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            Volver al inicio
          </ButtonLink>
        </>
      }
      footnote={
        <>
          Si el problema persiste, escríbenos a{" "}
          <a href="mailto:support@ethicvoice.co" className="text-ev-night underline decoration-ev-signal decoration-2 underline-offset-4">
            support@ethicvoice.co
          </a>
          {error.digest ? <span className="ev-label ml-3 text-ev-haze">Ref. {error.digest}</span> : null}
        </>
      }
    />
  );
}
