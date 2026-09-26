import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import React from "react";

const SubmitLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Formulario anónimo del denunciante, no una página de venta: sin CTA de
    // demo flotante, sin bloque de cierre comercial y sin la franja
    // "¿Vienes a reportar?" (ya está aquí).
    <MarketingPageShell showStickyCta={false} showFooter={false} showWhatsApp={false} hideUtility>
      {children}
    </MarketingPageShell>
  );
};

export default SubmitLayout;
