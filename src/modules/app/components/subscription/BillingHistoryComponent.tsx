"use client";

import React, { useState, useEffect } from "react";
import {
  BillingHistory,
  formatPrice,
  getSubscriptionStatusColor,
  getSubscriptionStatusLabel,
} from "@/types/subscription.types";

interface BillingHistoryComponentProps {
  subscriptionId: number;
}

export default function BillingHistoryComponent({
  subscriptionId,
}: BillingHistoryComponentProps) {
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    fetchBillingHistory();
  }, [subscriptionId]);

  const fetchBillingHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/subscriptions/billing-history?subscriptionId=${subscriptionId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch billing history");
      }

      const result = await response.json();
      setBillingHistory(result.billingHistory);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCEEDED":
        return "text-green-600 bg-green-100";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100";
      case "FAILED":
        return "text-red-600 bg-red-100";
      case "REFUNDED":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTransactionStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCEEDED":
        return "Exitoso";
      case "PENDING":
        return "Pendiente";
      case "FAILED":
        return "Fallido";
      case "REFUNDED":
        return "Reembolsado";
      default:
        return status;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <i className="icon-[lucide--alert-circle] w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!billingHistory) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <i className="icon-[lucide--receipt] w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No hay historial de facturación disponible
          </p>
        </div>
      </div>
    );
  }

  const { subscription, transactions, planChangeHistory, summary, providerInvoices } =
    billingHistory as any;

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Información de Suscripción
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Plan Actual
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {subscription.planName}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSubscriptionStatusColor(subscription.status)}`}
            >
              {getSubscriptionStatusLabel(subscription.status)}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Ciclo de Facturación
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {subscription.billingCycle === "YEARLY" ? "Anual" : "Mensual"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Precio</h3>
            <p className="text-lg font-semibold text-gray-900">
              {subscription.billingCycle === "YEARLY" &&
              subscription.yearlyPrice
                ? formatPrice(subscription.yearlyPrice)
                : formatPrice(subscription.monthlyPrice || 0)}
              <span className="text-sm font-normal text-gray-600">
                /{subscription.billingCycle === "YEARLY" ? "año" : "mes"}
              </span>
            </p>
          </div>
        </div>

        {subscription.endDate && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <i className="icon-[lucide--calendar] w-4 h-4 inline mr-1" />
              {subscription.status === "ACTIVE"
                ? `Próxima facturación: ${formatDate(subscription.endDate)}`
                : `Finaliza: ${formatDate(subscription.endDate)}`}
            </p>
          </div>
        )}
      </div>

      {/* Provider Invoices (Mercado Pago) */}
      {Array.isArray(providerInvoices) && providerInvoices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Facturas pagadas (Mercado Pago)
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providerInvoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(inv.paidAt || inv.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {inv.description || "Pago de suscripción"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-green-700 bg-green-100">
                        Pagada
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatPrice(inv.amount || 0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      {inv.receiptUrl ? (
                        <a
                          href={inv.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <i className="icon-[lucide--external-link] w-4 h-4" />
                          Ver recibo
                        </a>
                      ) : (
                        <span className="text-gray-400">Sin recibo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Resumen de Facturación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {formatPrice(summary.totalPaid)}
            </div>
            <div className="text-sm text-green-600">Total Pagado</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {formatPrice(summary.totalRefunded)}
            </div>
            <div className="text-sm text-blue-600">Total Reembolsado</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {summary.transactionCount}
            </div>
            <div className="text-sm text-gray-600">Transacciones</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {summary.planChanges}
            </div>
            <div className="text-sm text-purple-600">Cambios de Plan</div>
          </div>
        </div>
      </div>

      {/* Plan Change History */}
      {planChangeHistory && planChangeHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Historial de Cambios de Plan
          </h2>

          <div className="space-y-4">
            {(planChangeHistory as Array<any>).map((change: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <i className="icon-[lucide--arrow-right] w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {change.fromPlan} → {change.toPlan}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(change.changedAt)}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Facturación: {change.fromBilling} → {change.toBilling}
                  </p>
                  {change.prorationAmount !== 0 && (
                    <p
                      className={
                        change.prorationAmount > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    >
                      Prorrateo: {change.prorationAmount > 0 ? "+" : ""}
                      {formatPrice(change.prorationAmount)}
                    </p>
                  )}
                  <p>Razón: {change.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Historial de Transacciones
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <i className="icon-[lucide--credit-card] w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gateway
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(transactions as Array<any>).map((transaction: any) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(transaction.status)}`}
                      >
                        {getTransactionStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.gateway}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Detalles de Transacción
                </h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar modal"
                >
                  <i className="icon-[lucide--x] w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    ID de Transacción
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    #{selectedTransaction.id}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Monto
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPrice(
                      selectedTransaction.amount,
                      selectedTransaction.currency
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Estado
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTransactionStatusColor(selectedTransaction.status)}`}
                  >
                    {getTransactionStatusLabel(selectedTransaction.status)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Gateway
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTransaction.gateway}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Fecha
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedTransaction.createdAt)}
                  </p>
                </div>

                {selectedTransaction.providerTransactionId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      ID del Proveedor
                    </h3>
                    <p className="text-sm text-gray-900 font-mono">
                      {selectedTransaction.providerTransactionId}
                    </p>
                  </div>
                )}
              </div>

              {selectedTransaction.metadata && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Metadata
                  </h3>
                  <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-800 overflow-x-auto">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
