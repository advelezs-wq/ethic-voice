import PostalMime from "postal-mime";

interface Env {
  WEBHOOK_URL: string;
  WEBHOOK_SECRET: string;
  /** "info=persona@gmail.com,soporte=otra@empresa.com" */
  STAFF_FORWARDS?: string;
}

// Vercel limita el cuerpo de la petición a 4.5 MB; el texto de una denuncia
// nunca se acerca, pero un HTML con imágenes incrustadas sí.
const MAX_HTML_CHARS = 1_000_000;

function staffDestination(env: Env, localPart: string): string | null {
  for (const pair of (env.STAFF_FORWARDS || "").split(",")) {
    const [local, dest] = pair.split("=").map((s) => s.trim().toLowerCase());
    if (local && dest && local === localPart) return dest;
  }
  return null;
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const to = message.to.toLowerCase();
    const localPart = to.split("@")[0];

    // 1) Buzones internos del equipo → correo real.
    const staff = staffDestination(env, localPart);
    if (staff) {
      await message.forward(staff);
      return;
    }

    // 2) Todo lo demás es la bandeja de denuncias de un cliente ({slug}@).
    const raw = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(raw);

    const html = typeof email.html === "string" ? email.html : "";
    const payload = {
      // Misma forma que el webhook de ImprovMX, para reutilizar el normalizador.
      from: { email: email.from?.address || message.from, name: email.from?.name || "" },
      to: [{ email: to }],
      subject: email.subject || "(sin asunto)",
      text: email.text || "",
      html: html.length > MAX_HTML_CHARS ? "" : html,
      "message-id": email.messageId || message.headers.get("message-id") || "",
      timestamp: Date.now(),
      // Solo metadatos: la plataforma no guarda adjuntos de correo, y el
      // contenido en base64 podría superar el límite de Vercel.
      attachments: (email.attachments || []).map((a) => ({
        name: a.filename || "adjunto",
        type: a.mimeType,
        size: typeof a.content === "string" ? a.content.length : a.content.byteLength,
      })),
      provider: "cloudflare",
    };

    let res: Response;
    try {
      res = await fetch(env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": env.WEBHOOK_SECRET,
          "user-agent": "EthicVoice-Cloudflare-Email-Worker/1.0",
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Error de red: rechazo temporal para que el servidor de origen reintente.
      throw new Error(`Webhook inaccesible: ${String(e)}`);
    }

    // 429 (límite de tasa) o 5xx: rechazo temporal; el servidor de origen
    // reintenta más tarde y la denuncia no se pierde.
    // 401/403 = secreto mal configurado: también temporal, para no perder
    // denuncias mientras se corrige (aparece en `wrangler tail`).
    if (res.status === 401 || res.status === 403 || res.status === 429 || res.status >= 500) {
      throw new Error(`Webhook respondió ${res.status}`);
    }

    const body = (await res.json().catch(() => ({}))) as { success?: boolean; reason?: string };

    // Dirección que no corresponde a ninguna bandeja activa: rebotar, para que
    // quien escribió sepa que su denuncia no llegó (en vez de perderla).
    if (body.reason === "unknown_recipient") {
      message.setReject(
        "Esta dirección no recibe denuncias. Verifica la dirección o usa el formulario web de la línea ética de tu organización."
      );
      return;
    }

    // Spam, duplicados o plan sin canal de correo: se acepta en silencio (el
    // webhook ya lo registró) para no dar señales a remitentes abusivos.
  },
};
