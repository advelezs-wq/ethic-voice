"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Input, Pagination, Spinner } from "@heroui/react";

export type EbookLeadRow = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  company: string;
  role: string;
  campaign: string;
  sourcePath: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  userAgent: string | null;
  createdAt: string;
};

type ListResponse = {
  leads: EbookLeadRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
};

export function SuperAdminEbookLeadsTable() {
  const [rows, setRows] = useState<EbookLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [appliedCampaign, setAppliedCampaign] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: "25",
      });
      if (appliedCampaign.trim()) {
        qs.set("campaign", appliedCampaign.trim());
      }
      const res = await fetch(`/api/superadmin/ebook-leads?${qs}`, { cache: "no-store" });
      const data = (await res.json()) as ListResponse;
      if (!res.ok) {
        setError(data.error || "No se pudieron cargar los leads.");
        setRows([]);
        return;
      }
      setRows(data.leads || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total ?? 0);
    } catch {
      setError("Error de red al cargar los leads.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, appliedCampaign]);

  useEffect(() => {
    load();
  }, [load]);

  const applyCampaignFilter = () => {
    setPage(1);
    setAppliedCampaign(campaignFilter.trim());
  };

  const exportCsv = () => {
    const headers = [
      "createdAt",
      "fullName",
      "email",
      "phone",
      "company",
      "role",
      "campaign",
      "sourcePath",
      "utmSource",
      "utmMedium",
      "utmCampaign",
      "utmContent",
      "utmTerm",
    ] as const;
    const escape = (v: string | null | undefined) => {
      const s = v ?? "";
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => escape(String(r[h as keyof EbookLeadRow] ?? "")))
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ebook-leads-pagina-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Leads · Guía PDF</h2>
            <p className="mt-1 text-sm text-default-500">
              Registros desde el formulario público de descarga ({total} en esta vista filtrada).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              size="sm"
              label="Campaña"
              placeholder="ej. guia_canal_denuncias"
              value={campaignFilter}
              onValueChange={setCampaignFilter}
              className="min-w-[200px] max-w-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCampaignFilter();
              }}
            />
            <Button size="sm" color="primary" variant="flat" onPress={applyCampaignFilter}>
              Filtrar
            </Button>
            <Button
              size="sm"
              variant="light"
              onPress={exportCsv}
              isDisabled={rows.length === 0}
              startContent={<i className="icon-[lucide--download] size-4" />}
            >
              CSV (página)
            </Button>
            <Button
              size="sm"
              variant="light"
              onPress={() => load()}
              startContent={<i className="icon-[lucide--refresh-ccw] size-4" />}
            >
              Refrescar
            </Button>
          </div>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-danger">{error}</p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner label="Cargando leads…" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-default-500">No hay leads que mostrar.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="text-left text-default-500">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Correo</th>
                    <th className="py-2 pr-3">Teléfono</th>
                    <th className="py-2 pr-3">Empresa</th>
                    <th className="py-2 pr-3">Cargo</th>
                    <th className="py-2 pr-3">Campaña</th>
                    <th className="py-2 pr-3">UTM</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-default-100">
                      <td className="whitespace-nowrap py-2 pr-3 text-default-600">
                        {new Date(r.createdAt).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="max-w-[140px] truncate py-2 pr-3 font-medium">{r.fullName}</td>
                      <td className="max-w-[180px] truncate py-2 pr-3">
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                          {r.email}
                        </a>
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-default-700">{r.phone}</td>
                      <td className="max-w-[120px] truncate py-2 pr-3">{r.company}</td>
                      <td className="max-w-[120px] truncate py-2 pr-3">{r.role}</td>
                      <td className="py-2 pr-3">
                        <Chip size="sm" variant="flat">
                          {r.campaign}
                        </Chip>
                      </td>
                      <td className="max-w-[200px] py-2 pr-3 text-xs text-default-500">
                        {[r.utmSource, r.utmMedium, r.utmCampaign].filter(Boolean).join(" · ") || "—"}
                        {r.sourcePath ? (
                          <span className="mt-0.5 block truncate text-default-400" title={r.sourcePath || ""}>
                            {r.sourcePath}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex justify-center pt-4">
                <Pagination total={totalPages} page={page} onChange={setPage} showControls size="sm" />
              </div>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
