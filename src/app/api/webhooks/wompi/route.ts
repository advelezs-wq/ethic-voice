import { NextRequest, NextResponse } from "next/server";
import { refreshTransaction } from "@/modules/app/services/billing.service";
import { verifyEventChecksum } from "@/modules/app/services/wompi.service";

/**
 * Eventos de Wompi (Dashboard → Desarrolladores → URL de eventos):
 *   https://www.ethicvoice.co/api/webhooks/wompi
 * Se verifica el checksum con WOMPI_EVENTS_SECRET y, además, el estado del
 * cobro se vuelve a consultar en la API de Wompi: nunca se confía en el cuerpo.
 */
export async function POST(req: NextRequest) {
  const event = await req.json().catch(() => null);
  if (!event || !verifyEventChecksum(event, req.headers.get("x-event-checksum"))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  if (event.event === "transaction.updated" && event.data?.transaction?.id) {
    try {
      await refreshTransaction(String(event.data.transaction.id));
    } catch (e) {
      // 500 → Wompi reintenta (30 min, 3 h, 24 h).
      console.error("[wompi-webhook]", e);
      return NextResponse.json({ error: "No se pudo procesar" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
