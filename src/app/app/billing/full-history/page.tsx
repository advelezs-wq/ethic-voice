"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";

interface InvoiceItem {
  id: string;
  description?: string;
  amount: string | number;
  currency?: string;
  createdAt: string;
  status?: string;
}

export default function FullBillingHistoryPage() {
  const { currentOrganization } = useOrganization();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentOrganization?.id) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organization/${currentOrganization.id}/billing-history`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setInvoices(data.invoices || []);
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();
  }, [currentOrganization?.id]);

  const grouped = useMemo(() => {
    const onlyPaid = invoices.filter(
      (i) => String(i.status).toLowerCase() === "paid"
    );
    const map: Record<string, InvoiceItem[]> = {};
    for (const inv of onlyPaid) {
      try {
        const d = new Date(inv.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        (map[key] = map[key] || []).push(inv);
      } catch {
        (map.unknown = map.unknown || []).push(inv);
      }
    }
    return Object.entries(map)
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([k, items]) => ({
        key: k,
        items: items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));
  }, [invoices]);

  const formatPrice = (v: string | number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(v || 0));
  const formatDate = (s: string) => new Date(s).toLocaleString("es-CO");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Historial de Facturación</h1>
      </div>

      {loading ? (
        <div className="text-gray-500">Cargando…</div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              <h2 className="text-lg font-semibold">{group.key}</h2>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.items.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(inv.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {inv.description || "Pago"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatPrice(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${String(inv.status).toLowerCase() === "paid" ? "text-green-700 bg-green-100" : "text-gray-700 bg-gray-100"}`}
                          >
                            {inv.status || ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <button
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            onClick={() =>
                              window.open(
                                `/api/invoices/download?id=${encodeURIComponent(String(inv.id))}`,
                                "_blank"
                              )
                            }
                          >
                            <i className="icon-[lucide--download] w-4 h-4" />{" "}
                            Descargar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
