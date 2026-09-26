import type { Metadata } from "next";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { Arrow, ButtonLink, buttonClasses, Voice } from "@/modules/brand/components/primitives";
import { PageHero } from "@/modules/brand/components/sections";

export const metadata: Metadata = {
  title: "Portal de Partners | EthicVoice",
  robots: { index: false, follow: true },
};

export default function PartnersPortalPage() {
  return (
    <MarketingPageShell showFooter={false} showStickyCta={false}>
      <PageHero
        index="P"
        kicker="Portal de Partners"
        title={["Bienvenido al", <>portal de <Voice>partners.</Voice></>]}
        lead={
          <>
            Accede al espacio exclusivo para socios de EthicVoice. Si aún no
            tienes acceso, escríbenos a partners@ethicvoice.co.
          </>
        }
        actions={
          <>
            <ButtonLink href="/auth/sign-in" variant="ink" size="lg" arrow>
              Iniciar sesión
            </ButtonLink>
            <a href="mailto:partners@ethicvoice.co" className={buttonClasses("outline", "lg")}>
              Solicitar acceso <Arrow />
            </a>
          </>
        }
      />
    </MarketingPageShell>
  );
}
