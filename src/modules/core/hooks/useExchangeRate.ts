"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RatesMap = Record<string, number>;

interface UseExchangeRateOptions {
  base?: string; // e.g., COP
  symbols?: string[]; // e.g., ["USD"]
  ttlMs?: number; // cache TTL in ms
}

interface UseExchangeRateReturn {
  base: string;
  rates: RatesMap | null;
  loading: boolean;
  error: string | null;
  convert: (amount: number, to: string) => number | null;
}

// Public, no-key endpoint with CORS: https://api.exchangerate.host
// Example: /latest?base=COP&symbols=USD
// In-memory caches to avoid duplicated requests between components
const MEMORY_CACHE = new Map<string, { ts: number; rates: RatesMap }>();
const IN_FLIGHT = new Map<string, Promise<RatesMap>>();

export function useExchangeRate(options?: UseExchangeRateOptions): UseExchangeRateReturn {
  const base = options?.base || "COP";
  const ttlMs = options?.ttlMs ?? 12 * 60 * 60 * 1000; // 12h
  const symbolsArr = useMemo(() => (options?.symbols && options.symbols.length > 0 ? options.symbols : ["USD"]), [options?.symbols?.join(",")]);
  const symbolsKey = useMemo(() => symbolsArr.slice().sort().join("_"), [symbolsArr]);

  const [rates, setRates] = useState<RatesMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheKey = `fx_${base}_${symbolsKey}`;

    const fromCache = () => {
      // 1) In-memory cache (fastest, per tab)
      const mem = MEMORY_CACHE.get(cacheKey);
      if (mem && Date.now() - mem.ts < ttlMs) {
        setRates(mem.rates);
        setLoading(false);
        return true;
      }
      // 2) localStorage cache (persists across reloads)
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { ts: number; rates: RatesMap };
        if (Date.now() - parsed.ts < ttlMs) {
          setRates(parsed.rates);
          MEMORY_CACHE.set(cacheKey, { ts: parsed.ts, rates: parsed.rates });
          setLoading(false);
          return true;
        }
      } catch {}
      return false;
    };

    if (fromCache()) return;

    // De-duplicate concurrent fetches for same key
    const existing = IN_FLIGHT.get(cacheKey);
    if (existing) {
      setLoading(true);
      existing
        .then((r) => setRates(r))
        .catch((e) => setError(e instanceof Error ? e.message : "FX error"))
        .finally(() => setLoading(false));
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const promise = fetchFxRates(base, symbolsArr.join(","))
      .then((ratesResp) => {
        MEMORY_CACHE.set(cacheKey, { ts: Date.now(), rates: ratesResp });
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ ts: Date.now(), rates: ratesResp })
          );
        } catch {}
        return ratesResp;
      })
      .finally(() => {
        IN_FLIGHT.delete(cacheKey);
      });

    IN_FLIGHT.set(cacheKey, promise);
    promise
      .then((r) => setRates(r))
      .catch((e) => setError(e instanceof Error ? e.message : "FX error"))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [base, ttlMs, symbolsKey, symbolsArr]);

  const convert = useMemo(() => {
    return (amount: number, to: string): number | null => {
      if (!rates) return null;
      const rate = rates[to];
      if (!rate || !Number.isFinite(rate)) return null;
      return amount * rate;
    };
  }, [rates]);

  return { base, rates, loading, error, convert };
}

// Helper (shared) – fetch with provider fallback
export async function fetchFxRates(
  base: string,
  symbolsCsv: string
): Promise<RatesMap> {
  const envUrl = process.env.NEXT_PUBLIC_EXCHANGE_RATES_URL;
  const envKey = process.env.NEXT_PUBLIC_EXCHANGE_RATES_KEY;

  const tryUrls: Array<() => Promise<RatesMap>> = [];

  // 1) Custom provider via env (supports apilayer-style access_key)
  if (envUrl) {
    tryUrls.push(async () => {
      const url = new URL(envUrl);
      url.searchParams.set("base", base);
      url.searchParams.set("symbols", symbolsCsv);
      if (envKey) url.searchParams.set("access_key", envKey);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      const parsed = normalizeFxResponse(data, base);
      if (!parsed) throw new Error("FX env provider invalid");
      return parsed;
    });
  }

  // 2) exchangerate.host (público) – algunos proxys piden access_key de apilayer
  tryUrls.push(async () => {
    const url = new URL("https://api.exchangerate.host/latest");
    url.searchParams.set("base", base);
    url.searchParams.set("symbols", symbolsCsv);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    const parsed = normalizeFxResponse(data, base);
    if (!parsed) throw new Error("FX host invalid");
    return parsed;
  });

  // 3) open.er-api.com (sin key)
  tryUrls.push(async () => {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    const data = await res.json();
    const parsed = normalizeFxResponse(data, base);
    if (!parsed) throw new Error("FX er-api invalid");
    return parsed;
  });

  // 4) jsDelivr currency-api (estático diario)
  tryUrls.push(async () => {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`
    );
    const data = await res.json();
    const parsed = normalizeFxResponse(data, base);
    if (!parsed) throw new Error("FX cdn invalid");
    return parsed;
  });

  let lastErr: unknown;
  for (const fn of tryUrls) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("FX all providers failed");
}

function normalizeFxResponse(data: any, base: string): RatesMap | null {
  // exchangerate.host shape
  if (data && data.rates && typeof data.rates === "object") return data.rates as RatesMap;
  // apilayer error detection – do not treat as success
  if (data && data.success === false) return null;
  // open.er-api.com shape
  if (data && data.result === "success" && data.rates) return data.rates as RatesMap;
  // cdn currency-api shape: { base: 'cop', date: '...', cop: { usd: 0.00025, eur: ... } }
  const lower = base.toLowerCase();
  if (data && data[lower] && typeof data[lower] === "object") {
    const obj = data[lower];
    const upper: RatesMap = {};
    Object.keys(obj).forEach((k) => (upper[k.toUpperCase()] = Number(obj[k])));
    return upper;
  }
  return null;
}


