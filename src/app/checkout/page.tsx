import { Suspense } from "react";
import { redirect } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";

// Force dynamic rendering since we use searchParams and database queries
export const dynamic = "force-dynamic";

type CheckoutSearchParams = { subscription_id?: string };
interface CheckoutPageProps {
  searchParams: Promise<CheckoutSearchParams>;
}

async function CheckoutContent({
  searchParams,
}: {
  searchParams: CheckoutSearchParams;
}) {
  const subscriptionId = searchParams.subscription_id;

  if (!subscriptionId) {
    redirect("/pricing");
  }

  // Get subscription details
  const subscription = await prisma.subscription.findUnique({
    where: { id: parseInt(subscriptionId) },
  });

  if (!subscription) {
    redirect("/pricing");
  }

  if (subscription.status === "ACTIVE") {
    redirect("/app");
  }

  const amount = subscription.monthlyPrice || subscription.yearlyPrice || 0;
  const currency = subscription.currency as "USD" | "COP";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Subscription
          </h1>
          <p className="text-gray-600 mt-2">
            You're subscribing to {subscription.planName}
          </p>
        </div>

        <div className="shadow-lg rounded-xl border border-gray-200 bg-white">
          <div className="p-6 border-b border-gray-100">
            <div className="w-full">
              <h2 className="text-xl font-semibold">{subscription.planName}</h2>
              <p className="text-gray-600">
                {currency === "USD" ? "$" : "COP$ "}
                {amount.toLocaleString()} /{" "}
                {subscription.billingCycle === "YEARLY" ? "year" : "month"}
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Recommended: Use Our Enhanced Checkout
                </h3>
                <p className="text-blue-700 mb-4">
                  For a better experience, we recommend starting from our
                  pricing page.
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Pricing Page
                </a>
              </div>

              <div className="text-sm text-gray-500">
                <p>This checkout page is for direct access only.</p>
                <p>
                  For the best experience, please use our main pricing page.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Payments are processed securely by Rebill</p>
          <p>Your subscription will be activated immediately after payment</p>
        </div>
      </div>
    </div>
  );
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-10 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
            <p className="mt-2 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
