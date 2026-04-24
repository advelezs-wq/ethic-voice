/**
 * Verificación del token hCaptcha contra https://hcaptcha.com/siteverify
 * Usa HCAPTCHA_SECRET_KEY. Si no está definida, devuelve true (solo desarrollo / rutas sin captcha obligatorio).
 */

export type HCaptchaVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyHcaptchaToken(token: string, remoteip?: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn("[hcaptcha] HCAPTCHA_SECRET_KEY no configurada; se omite la verificación.");
    return true;
  }

  const trimmed = token.trim();
  if (!trimmed || trimmed.length > 4096) {
    return false;
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: trimmed,
    });
    if (remoteip) {
      params.set("remoteip", remoteip.slice(0, 45));
    }

    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = (await response.json()) as HCaptchaVerifyResponse;
    return Boolean(data.success);
  } catch (e) {
    console.error("[hcaptcha] Error en siteverify:", e);
    return false;
  }
}
