import prisma from "@/modules/prisma/lib/prisma";

/**
 * Consultas de facturación de una suscripción. Los cambios de plan,
 * cancelaciones y reactivaciones viven en /api/subscriptions/* y se sincronizan
 * con Mercado Pago (única pasarela). Este servicio conservaba además métodos
 * de Rebill que ya no se usaban y se retiraron.
 */
class SubscriptionManagerService {
  async getBillingHistory(subscriptionId: number) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          paymentTransactions: {
            orderBy: { createdAt: "desc" },
          },
          organization: true,
        },
      });

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      const safeMetadata =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? (subscription.metadata as Record<string, unknown>)
          : {};
      const planChangeHistory = Array.isArray(
        (safeMetadata as any).planChangeHistory
      )
        ? ((safeMetadata as any).planChangeHistory as unknown[])
        : [];

      return {
        subscription,
        transactions: subscription.paymentTransactions,
        planChangeHistory,
        totalPaid: subscription.paymentTransactions
          .filter((t) => t.status === "SUCCEEDED")
          .reduce((sum, t) => sum + Number(t.amount), 0),
        totalRefunded: subscription.paymentTransactions
          .filter((t) => t.status === "REFUNDED")
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };
    } catch (error) {
      console.error("❌ Error getting billing history:", error);
      throw error;
    }
  }
}

// Export singleton instance
const subscriptionManager = new SubscriptionManagerService();
export default subscriptionManager;
