"use client";

import { useState, useEffect } from "react";

interface TrackingSearchProps {
  onSearch: (code: string) => void;
  initialCode?: string;
  isLoading?: boolean;
}

export function TrackingSearch({
  onSearch,
  initialCode = "",
  isLoading = false,
}: TrackingSearchProps) {
  const [code, setCode] = useState("");

  // Only set initial code once on mount, don't update when initialCode changes
  useEffect(() => {
    if (initialCode && !code) {
      // Strip the REP- prefix if present, keep the opaque token as-is
      const token = initialCode.replace(/^REP-/i, "");
      setCode(token);
    }
  }, []); // Empty dependency array to only run on mount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    onSearch(`REP-${code.trim().toUpperCase()}`);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Alphanumeric token, 12 chars (see FormSubmission.trackingToken)
    const value = e.target.value
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 12)
      .toUpperCase();
    setCode(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.75rem] border border-ev-night/10 bg-white p-6 shadow-[0_50px_100px_-50px_rgba(11,29,33,0.45)] sm:p-9"
    >
      <label htmlFor="tracking-code" className="ev-label text-ev-mute">
        Código de referencia
      </label>
      <div className="mt-2 flex h-16 items-center rounded-xl border border-ev-line bg-white transition-[border-color,box-shadow] focus-within:border-ev-night/50 focus-within:shadow-[0_0_0_4px_rgba(152,208,80,0.3)]">
        <span className="pl-5 font-mono text-lg text-ev-haze">REP-</span>
        <input
          id="tracking-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="A1B2C3D4E5F6"
          value={code}
          onChange={handleCodeChange}
          maxLength={12}
          disabled={isLoading}
          className="h-full min-w-0 flex-1 bg-transparent pl-1 pr-4 font-mono text-lg tracking-[0.08em] text-ev-night outline-none placeholder:text-ev-line"
        />
      </div>
      <p className="ev-label mt-3 text-ev-haze">REP- seguido de 12 letras o números</p>
      <button
        type="submit"
        disabled={!code.trim() || isLoading}
        className="ev-press mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ev-night text-base font-medium text-white hover:bg-ev-slate disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? "Buscando…" : "Consultar mi caso →"}
      </button>
    </form>
  );
}
