"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { forwardRef, useImperativeHandle, useRef } from "react";

export type EbookLeadCaptchaHandle = {
  reset: () => void;
};

type Props = {
  onToken: (token: string | null) => void;
  theme?: "light" | "dark";
};

/**
 * Muestra hCaptcha solo si existe `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`.
 * El servidor exige verificación cuando `HCAPTCHA_SECRET_KEY` está definida.
 */
export const EbookLeadCaptcha = forwardRef<EbookLeadCaptchaHandle, Props>(function EbookLeadCaptcha(
  { onToken, theme = "light" },
  ref
) {
  const inner = useRef<HCaptcha>(null);
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? "";

  useImperativeHandle(ref, () => ({
    reset: () => {
      inner.current?.resetCaptcha();
      onToken(null);
    },
  }));

  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center py-1">
      <HCaptcha
        ref={inner}
        sitekey={siteKey}
        theme={theme}
        onVerify={(t) => onToken(t)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
});
