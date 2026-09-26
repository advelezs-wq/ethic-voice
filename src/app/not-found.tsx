import { ButtonLink } from "@/modules/brand/components/primitives";
import { StatusScreen } from "@/modules/brand/components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      code="404"
      title={
        <>
          Esta página no <em className="ev-serif pr-[0.06em]">existe.</em>
        </>
      }
      body="Es posible que el enlace haya cambiado o que la dirección tenga un error. Si viniste a hacer una denuncia, el canal sigue disponible."
      actions={
        <>
          <ButtonLink href="/" variant="ink" size="lg" arrow>
            Ir al inicio
          </ButtonLink>
          <ButtonLink href="/submit" variant="outline" size="lg">
            Hacer una denuncia
          </ButtonLink>
          <ButtonLink href="/app" variant="text" className="h-14 px-2">
            Ir a mi panel
          </ButtonLink>
        </>
      }
      footnote={
        <>
          ¿Necesitas ayuda?{" "}
          <a href="mailto:support@ethicvoice.co" className="text-ev-night underline decoration-ev-signal decoration-2 underline-offset-4">
            support@ethicvoice.co
          </a>
        </>
      }
    />
  );
}
