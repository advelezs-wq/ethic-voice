import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { WompiCheckout } from "@/modules/app/components/checkout/WompiCheckout";
import { BillingCycle, PLAN_CONFIGS, PlanType } from "@/types/subscription.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contratar plan · EthicVoice" };

/** Checkout con Wompi: /checkout?plan=GROW&billing=MONTHLY */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  const sp = await searchParams;
  const plan = String(sp.plan || "").toUpperCase() as PlanType;
  const cycle = String(sp.billing || "").toUpperCase() === "YEARLY" ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
  if (!PLAN_CONFIGS[plan] || !PLAN_CONFIGS[plan].priceCop.monthly) redirect("/pricing");

  const { userId } = await auth();
  if (!userId) {
    const back = `/checkout?plan=${plan}&billing=${cycle}`;
    redirect(`/auth/sign-up?redirect_url=${encodeURIComponent(back)}`);
  }

  return <WompiCheckout planType={plan} billingCycle={cycle} />;
}
