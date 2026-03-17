import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import mercadoPagoService from "@/modules/app/services/mercadopago.service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    console.log("📋 [BILLING-HISTORY] Getting billing history for org:", orgId);

    // Get payment transactions for this organization
    const paymentTransactions = await prisma.paymentTransaction.findMany({
      where: {
        orgId: orgId, // Using correct field name from schema
      },
      orderBy: {
        transactionDate: "desc", // Using correct field name from schema
      },
      take: 50, // Limit to last 50 transactions
    });

    console.log(
      `📋 [BILLING-HISTORY] Found ${paymentTransactions.length} payment transactions`
    );

    // Transform payment transactions to invoice format
    const invoices = paymentTransactions.map((transaction) => {
      return {
        id: transaction.id.toString(),
        transactionId:
          transaction.providerTransactionId || `tx-${transaction.id}`,
        amount: transaction.amount?.toString() || "0",
        currency: transaction.currency || "COP",
        status:
          transaction.status === "SUCCEEDED"
            ? "paid"
            : transaction.status === "PENDING"
              ? "pending"
              : transaction.status === "FAILED"
                ? "failed"
                : transaction.status === "REFUNDED"
                  ? "refunded"
                  : "unknown",
        createdAt:
          transaction.transactionDate?.toISOString() ||
          new Date().toISOString(),
        updatedAt:
          transaction.updatedAt?.toISOString() || new Date().toISOString(),

        // Generate description based on transaction
        description: `Transacción de pago - ${formatAmount(parseFloat(transaction.amount?.toString() || "0"), transaction.currency || "COP")}`,

        // Payment method info (not available in current schema)
        paymentMethod: transaction.gateway || "N/A",

        // Additional metadata
        planType: null, // Not available in current transaction record
        subscriptionId: transaction.subscriptionId,
        orgId: transaction.orgId,

        // For now, we don't have direct invoice downloads
        downloadUrl: null,

        // Additional dates
        dueDate: null,
        paidAt:
          transaction.status === "SUCCEEDED"
            ? transaction.transactionDate?.toISOString()
            : null,
      };
    });

    // Get subscription history for additional context
    const subscriptions = await prisma.subscription.findMany({
      where: {
        orgId: orgId,
      },
      select: {
        id: true,
        planType: true,
        planName: true,
        status: true,
        startDate: true,
        endDate: true,
        monthlyPrice: true,
        currency: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `📋 [BILLING-HISTORY] Found ${subscriptions.length} subscriptions in history`
    );

    // Add subscription creation "invoices" for context
    const subscriptionInvoices = subscriptions.map((subscription) => ({
      id: `sub-${subscription.id}`,
      transactionId: null,
      amount: subscription.monthlyPrice?.toString() || "0",
      currency: subscription.currency || "COP",
      status: subscription.status === "ACTIVE" ? "active" : "inactive",
      createdAt:
        subscription.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt:
        subscription.createdAt?.toISOString() || new Date().toISOString(),
      description: `Suscripción ${subscription.planName || subscription.planType} creada`,
      paymentMethod: "N/A",
      planType: subscription.planType,
      subscriptionId: subscription.id,
      downloadUrl: null,
      dueDate: null,
      paidAt:
        subscription.status === "ACTIVE"
          ? subscription.startDate?.toISOString()
          : null,
    }));

    // Fetch provider invoices from Mercado Pago: recurring (authorized_payments) and one-time by external_reference
    const providerInvoices: any[] = [];
    for (const s of subscriptions) {
      try {
        // Recurring charges tied to preapproval_id
        const preId = (
          await prisma.subscription.findUnique({
            where: { id: s.id },
            select: { providerSubscriptionId: true },
          })
        )?.providerSubscriptionId;
        if (preId) {
          const res = await mercadoPagoService.searchAuthorizedPayments(
            String(preId)
          );
          if (res.success) {
            for (const r of res.results || []) {
              const pid = r?.payment?.id || r?.id;
              if (!pid) continue;
              try {
                const pay = await mercadoPagoService.getPayment(String(pid));
                if (pay?.status !== "approved") continue;
                providerInvoices.push({
                  id: `mp-${pay.id}`,
                  transactionId: String(pay.id),
                  amount: String(
                    Number(pay.transaction_amount || r.transaction_amount || 0)
                  ),
                  currency: String(
                    pay.currency_id || r.currency_id || s.currency || "COP"
                  ),
                  status: "paid",
                  createdAt: pay.date_created,
                  updatedAt: pay.date_last_updated,
                  paidAt: pay.date_approved || pay.date_last_updated,
                  description:
                    r?.reason ||
                    pay?.description ||
                    `Pago de suscripción ${s.planName || s.planType}`,
                  paymentMethod: "Mercado Pago",
                  planType: s.planType,
                  subscriptionId: s.id,
                  orgId,
                  downloadUrl:
                    pay?.transaction_details?.external_resource_url ||
                    pay?.receipt_url ||
                    null,
                });
              } catch (e) {
                console.warn(
                  "⚠️ [BILLING-HISTORY] Failed to enrich MP authorized payment",
                  { pid, err: (e as any)?.message }
                );
              }
            }
          }
        }

        // One-time payments by external_reference = subscription id (proration, etc.)
        const pr = await mercadoPagoService.searchPaymentsByExternalReference(
          String(s.id)
        );
        if (pr.success) {
          for (const pay of pr.results || []) {
            try {
              if (pay?.status !== "approved") continue;
              providerInvoices.push({
                id: `mp-${pay.id}`,
                transactionId: String(pay.id),
                amount: String(Number(pay.transaction_amount || 0)),
                currency: String(pay.currency_id || s.currency || "COP"),
                status: "paid",
                createdAt: pay.date_created,
                updatedAt: pay.date_last_updated,
                paidAt: pay.date_approved || pay.date_last_updated,
                description:
                  pay?.metadata?.type === "proration"
                    ? "Prorrateo cambio de plan"
                    : pay?.description || "Pago EthicVoice",
                paymentMethod: "Mercado Pago",
                planType: s.planType,
                subscriptionId: s.id,
                orgId,
                downloadUrl:
                  pay?.transaction_details?.external_resource_url ||
                  pay?.receipt_url ||
                  null,
              });
            } catch (e) {
              console.warn(
                "⚠️ [BILLING-HISTORY] Failed to map MP one-time payment",
                { id: pay?.id, err: (e as any)?.message }
              );
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ [BILLING-HISTORY] MP fetch error for subscription", {
          subId: s.id,
          err: (e as any)?.message,
        });
      }
    }

    // Debug which Mercado Pago payments we fetched
    if (providerInvoices.length) {
      console.log("🧾 [BILLING-HISTORY] MP payments fetched", {
        count: providerInvoices.length,
        ids: providerInvoices.map((p) => p.transactionId).slice(0, 20),
      });
    } else {
      console.log("🧾 [BILLING-HISTORY] No MP payments fetched for this org");
    }

    // Deduplicate by transactionId
    const seen = new Set<string>();
    const providerUnique = providerInvoices.filter((p) => {
      if (!p.transactionId) return true;
      if (seen.has(p.transactionId)) return false;
      seen.add(p.transactionId);
      return true;
    });

    // Combine and sort all billing items
    const allBillingItems = [
      ...providerUnique,
      ...invoices,
      ...subscriptionInvoices,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Optional flag to include non-paid items (e.g., include=all)
    const includeAll = new URL(req.url).searchParams.get("include") === "all";
    const returnedItems = includeAll
      ? allBillingItems
      : allBillingItems.filter(
          (i) => String(i.status).toLowerCase() === "paid"
        );

    console.log("✅ [BILLING-HISTORY] Returning billing history:", {
      totalItems: returnedItems.length,
      paymentTransactions: invoices.length,
      providerPayments: providerUnique.length,
      subscriptionItems: subscriptionInvoices.length,
    });

    return NextResponse.json({
      success: true,
      invoices: returnedItems,
      summary: {
        totalTransactions: paymentTransactions.length,
        totalSubscriptions: subscriptions.length,
        totalBillingItems: returnedItems.length,
        lastPayment: paymentTransactions[0]?.transactionDate || null,
      },
      groupedByMonth: returnedItems.reduce(
        (acc: Record<string, any[]>, item) => {
          try {
            const d = new Date(item.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            acc[key] = acc[key] || [];
            acc[key].push(item);
          } catch {
            (acc["unknown"] = acc["unknown"] || []).push(item);
          }
          return acc;
        },
        {}
      ),
    });
  } catch (error) {
    console.error("❌ [BILLING-HISTORY] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatAmount(amount: number, currency: string): string {
  if (currency === "COP") {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }
}
