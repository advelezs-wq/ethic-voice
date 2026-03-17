import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import subscriptionManager from "@/modules/app/services/subscription-manager.service";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";
import prisma from "@/modules/prisma/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get("subscriptionId");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Getting billing history for subscription:", {
      userId,
      subscriptionId,
    });

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: parseInt(subscriptionId),
        userId: userId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found or access denied" },
        { status: 404 }
      );
    }

    // Get billing history
    const billingHistory = await subscriptionManager.getBillingHistory(
      parseInt(subscriptionId)
    );

    // Fetch real Mercado Pago authorized payments (recurring) + one-time proration payments by external_reference
    let providerInvoices: any[] = [];
    try {
      if (subscription.providerSubscriptionId) {
        const res = await mercadoPagoService.searchAuthorizedPayments(String(subscription.providerSubscriptionId));
        if (res.success) {
          const items: any[] = res.results || [];
          const enriched = await Promise.all(
            items.map(async (r: any) => {
              try {
                const paymentId = r?.payment?.id || r?.id;
                if (!paymentId) return null;
                const pay = await mercadoPagoService.getPayment(String(paymentId));
                if (pay?.status !== "approved") return null;
                return {
                  id: pay.id,
                  amount: Number(pay.transaction_amount || r.transaction_amount || 0),
                  currency: String(pay.currency_id || r.currency_id || subscription.currency || "COP"),
                  status: "PAID",
                  createdAt: pay.date_created || r.date_created,
                  paidAt: pay.date_approved || pay.date_last_updated,
                  receiptUrl:
                    pay?.transaction_details?.external_resource_url ||
                    pay?.receipt_url ||
                    null,
                  description: r?.reason || pay?.description || "Suscripción EthicVoice",
                  externalReference:
                    pay?.external_reference || r?.external_reference || String(subscription.id),
                  source: "mercadopago",
                };
              } catch {
                return null;
              }
            })
          );
          providerInvoices = enriched.filter(Boolean) as any[];
        }
      }

      // Add one-time payments linked by external_reference = internal subscription id
      const oneTime = await mercadoPagoService.searchPaymentsByExternalReference(String(subscription.id));
      if (oneTime.success) {
        const extra = (oneTime.results || [])
          .filter((p: any) => p?.status === "approved")
          .map((pay: any) => ({
            id: pay.id,
            amount: Number(pay.transaction_amount || 0),
            currency: String(pay.currency_id || subscription.currency || "COP"),
            status: "PAID",
            createdAt: pay.date_created,
            paidAt: pay.date_approved || pay.date_last_updated,
            receiptUrl:
              pay?.transaction_details?.external_resource_url ||
              pay?.receipt_url ||
              null,
            description: pay?.description || pay?.metadata?.type === "proration" ? "Prorrateo cambio de plan" : "Pago EthicVoice",
            externalReference: String(subscription.id),
            source: "mercadopago",
          }));
        providerInvoices = [...providerInvoices, ...extra];
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch MP invoices", e);
    }

    console.log("✅ Billing history retrieved successfully:", {
      subscriptionId: billingHistory.subscription.id,
      transactionCount: billingHistory.transactions.length,
      totalPaid: billingHistory.totalPaid,
    });

    const allInvoices = [
      ...(providerInvoices || []),
      ...billingHistory.transactions.map((t) => ({
        id: String(t.id),
        amount: Number(t.amount || 0),
        currency: String(t.currency || subscription.currency || 'COP'),
        status: t.status,
        createdAt: t.createdAt,
        description: t.gateway || 'Pago',
        source: 'internal',
      })),
    ];

    return NextResponse.json({
      success: true,
      subscription: {
        id: billingHistory.subscription.id,
        planType: billingHistory.subscription.planType,
        planName: billingHistory.subscription.planName,
        status: billingHistory.subscription.status,
        billingCycle: billingHistory.subscription.billingCycle,
        startDate: billingHistory.subscription.startDate,
        endDate: billingHistory.subscription.endDate,
        monthlyPrice: billingHistory.subscription.monthlyPrice,
        yearlyPrice: billingHistory.subscription.yearlyPrice,
        currency: billingHistory.subscription.currency,
        createdAt: billingHistory.subscription.createdAt,
        updatedAt: billingHistory.subscription.updatedAt,
      },
      billingHistory: {
        transactions: billingHistory.transactions.map((transaction) => ({
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          gateway: transaction.gateway,
          providerTransactionId: transaction.providerTransactionId,
          createdAt: transaction.createdAt,
          // metadata field not present in PaymentTransaction schema
        })),
        providerInvoices,
        planChangeHistory: billingHistory.planChangeHistory,
        summary: {
          totalPaid: billingHistory.totalPaid,
          totalRefunded: billingHistory.totalRefunded,
          netAmount: billingHistory.totalPaid - billingHistory.totalRefunded,
          transactionCount: billingHistory.transactions.length,
          planChanges: billingHistory.planChangeHistory.length,
        },
      },
      invoices: allInvoices,
    });
  } catch (error) {
    console.error("❌ Error in billing-history API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
