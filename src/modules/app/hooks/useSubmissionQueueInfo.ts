"use client";

import { useEffect, useState } from "react";

interface SubmissionQueueInfo {
  status: string;
  position: number | null;
  eta: string | null;
}

export function useSubmissionQueueInfo(
  submissionId: number | null,
  pollMs = 8000
) {
  const [info, setInfo] = useState<SubmissionQueueInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!submissionId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ai/status/submission/${submissionId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("No se pudo obtener información de la cola");
      const data = await res.json();
      setInfo({ status: data.status, position: data.position, eta: data.eta });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!submissionId) return;
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [submissionId, pollMs]);

  return { info, loading, error, refresh: load };
}
