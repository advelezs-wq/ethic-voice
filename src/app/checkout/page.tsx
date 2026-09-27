import { redirect } from "next/navigation";

/**
 * Página heredada del checkout con Rebill (ya no se usa). Los pagos se hacen
 * con Mercado Pago desde /pricing o desde Plan y facturación; se conserva la
 * ruta solo para no romper enlaces antiguos.
 */
export default function CheckoutPage() {
  redirect("/pricing");
}
