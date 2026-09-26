"use client";

import { useEffect, useRef, useState } from "react";
import { Image } from "@heroui/react";
import { Organization } from "@prisma/client";
import { useRouter } from "next/navigation";
import { searchOrganizationsPublic } from "@/actions/ethicline.actions";

type OrgSearchResult = Pick<
  Organization,
  "id" | "name" | "slug" | "logoUrl" | "brandColor" | "isActive"
>;

interface OrganizationSelectorProps {
  onSelect: (org: Organization) => void;
}

export function OrganizationSelector({ onSelect }: OrganizationSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrgSearchResult[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const orgs = await searchOrganizationsPublic(trimmed);
      setResults(orgs);
      setHasSearched(true);
      setIsSearching(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleContinue = () => {
    if (selectedOrg) onSelect(selectedOrg as Organization);
  };

  return (
    <div className="mx-auto w-full max-w-[var(--ev-max)] px-[var(--ev-gutter)] pb-24 pt-10 sm:pt-14">
      <div className="ev-label flex items-center justify-between border-b border-ev-line pb-4 text-ev-mute">
        <button type="button" onClick={() => router.back()} className="transition-colors hover:text-ev-night">
          ← Volver
        </button>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-ev-signal" /> Canal confidencial · Cifrado
        </span>
      </div>

      <div className="mt-12 grid gap-14 sm:mt-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p className="ev-label text-ev-moss">Paso 1 de 2</p>
          <h1 className="ev-display mt-6 text-ev-night">
            ¿En qué organización <em className="ev-serif pr-[0.06em]">ocurrió?</em>
          </h1>
          <p className="ev-lead mt-6 max-w-md">
            Busca tu organización para abrir su canal de denuncias. Si lo
            permite, podrás mantener tu identidad en anonimato durante toda la
            investigación.
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-[1.75rem] border border-ev-night/10 bg-white p-6 shadow-[0_50px_100px_-50px_rgba(11,29,33,0.45)] sm:p-9">
            <label htmlFor="org-search" className="ev-label text-ev-mute">
              Organización
            </label>
            <div className="relative mt-2">
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ev-haze" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                id="org-search"
                type="text"
                autoComplete="off"
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedOrg(null);
                }}
                placeholder="Escribe al menos 3 letras"
                className="h-14 w-full rounded-xl border border-ev-line bg-white pl-12 pr-12 text-base text-ev-night outline-none transition-[border-color,box-shadow] placeholder:text-ev-haze focus:border-ev-night/50 focus:shadow-[0_0_0_4px_rgba(152,208,80,0.3)]"
              />
              {isSearching ? (
                <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-ev-line border-t-ev-night" aria-label="Buscando" />
              ) : null}
            </div>

            {!selectedOrg && results.length > 0 && (
              <ul className="mt-3 divide-y divide-ev-line overflow-hidden rounded-xl border border-ev-line" role="listbox">
                {results.map((org) => (
                  <li key={org.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrg(org);
                        setResults([]);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ev-paper"
                    >
                      {org.logoUrl ? (
                        <Image src={org.logoUrl} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-ev-bone font-mono text-[0.625rem] text-ev-mute">
                          {org.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="text-[0.9375rem] text-ev-night">{org.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!selectedOrg && !isSearching && hasSearched && results.length === 0 && (
              <p className="mt-3 text-sm text-ev-mute">
                No encontramos una organización con ese nombre. Revisa la
                ortografía o usa el enlace directo que te compartió tu empresa.
              </p>
            )}

            {selectedOrg && (
              <div className="mt-4 flex items-center gap-4 rounded-xl bg-ev-signal-wash p-4">
                {selectedOrg.logoUrl ? (
                  <Image src={selectedOrg.logoUrl} alt="" className="h-12 w-12 object-contain" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white font-mono text-sm text-ev-mute">
                    {selectedOrg.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-[-0.02em] text-ev-night">{selectedOrg.name}</p>
                  <p className="ev-label mt-1 text-ev-moss">Seleccionada</p>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={!selectedOrg}
              onClick={handleContinue}
              className="ev-press mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ev-night text-base font-medium text-white hover:bg-ev-slate disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar con la denuncia →
            </button>

            <p className="mt-6 border-t border-ev-line pt-5 text-sm leading-relaxed text-ev-mute">
              La información que envíes se procesa bajo un flujo de
              confidencialidad y viaja cifrada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
