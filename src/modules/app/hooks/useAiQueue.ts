"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface AIJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  source: string;
  createdAt: string;
  errorMessage?: string | null;
  submission?: { id: number } | null;
}

interface AIStatusResponse {
  queues?: unknown;
  recentJobs: AIJob[];
  stats: Record<string, number>;
}

export function useAiQueue(pollMs: number = 8000) {
  const [recentJobs, setRecentJobs] = useState<AIJob[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await fetch("/api/ai/status", { cache: "no-store" });
      if (!res.ok)
        throw new Error("No se pudo obtener estado de la cola de IA");
      const data: AIStatusResponse = await res.json();
      setRecentJobs(data.recentJobs || []);
      setStats(data.stats || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, pollMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pollMs]);

  const submissionIdToStatus = useMemo(() => {
    const map = new Map<number, AIJob["status"]>();
    for (const job of recentJobs) {
      if (job.submission?.id) {
        map.set(job.submission.id, job.status);
      }
    }
    return map;
  }, [recentJobs]);

  const processingCount = stats["processing"] || 0;
  const pendingCount = stats["pending"] || 0;

  return {
    loading,
    error,
    stats,
    processingCount,
    pendingCount,
    recentJobs,
    submissionIdToStatus,
    refresh: fetchStatus,
  };
}
