import { NextResponse } from "next/server";
import { getAcceptanceTokens, isWompiConfigured, isWompiSandbox } from "@/modules/app/services/wompi.service";
import { billingError } from "@/modules/app/services/billing-auth";

/** Términos de Wompi que el cliente debe aceptar antes de guardar su tarjeta. */
export async function GET() {
  if (!isWompiConfigured()) {
    return NextResponse.json({ error: "Los pagos en línea no están disponibles en este momento." }, { status: 503 });
  }
  try {
    const t = await getAcceptanceTokens();
    return NextResponse.json({ ...t, publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY, sandbox: isWompiSandbox() });
  } catch (e) {
    return billingError(e);
  }
}
