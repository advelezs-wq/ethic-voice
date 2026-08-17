export interface NormalizedInboundEmail {
  sender: string;
  sender_name: string;
  recipient: string;
  subject: string;
  text: string;
  html: string;
  timestamp: number | string;
  "message-id": string;
  attachments: unknown[];
}

/**
 * ImprovMX's raw webhook payload nests `from`/`to` as objects/arrays; every
 * consumer (the ImprovMX route and the hardened /secure route) needs the
 * same flattened shape that EmailWebhookService.parseImprovMXWebhook expects.
 */
export function normalizeImprovMxPayload(
  data: Record<string, unknown>
): NormalizedInboundEmail {
  const from = (data.from || {}) as { email?: string; name?: string };
  const toEntry = Array.isArray(data.to) ? data.to[0] : null;
  const toEmail =
    (toEntry && typeof toEntry === "object" && "email" in toEntry
      ? String((toEntry as { email?: string }).email || "")
      : "") ||
    String(((data.envelope || {}) as { recipient?: string }).recipient || "");

  return {
    sender: from.email || String(data.sender || ""),
    sender_name: from.name || String(data.sender_name || ""),
    recipient: toEmail,
    subject: String(data.subject || ""),
    text: String(data.text || ""),
    html: typeof data.html === "string" ? data.html : "",
    timestamp: (data.timestamp as number | string) || Date.now(),
    "message-id": String(data["message-id"] || data.messageId || ""),
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };
}
