"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Input, Image, Spinner } from "@heroui/react";
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
    <div className="container mx-auto max-w-3xl px-4 py-16 md:py-20">
      <Button
        onPress={() => router.back()}
        variant="light"
        startContent={
          <i
            className="icon-[lucide--arrow-left] size-5 group-hover:-translate-x-1 transition-transform"
            role="img"
            aria-hidden="true"
          />
        }
        className="group mb-5 text-[#0d212c]"
      >
        Volver
      </Button>

      <div className="mb-8 rounded-3xl border border-[#0a1e14]/10 bg-white/90 p-6 text-center shadow-[0_14px_50px_rgba(10,30,20,0.08)] backdrop-blur-sm md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-lime-300 bg-lime-100/70 px-3 py-1 text-xs font-semibold text-[#0a1e14]">
            Canal confidencial
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#0a1e14]">
            Protección de identidad
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-[#0d212c]">
            Cifrado en tránsito
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-[#0a1e14] md:text-4xl">
          Seleccionar Organización
        </h1>
        <p className="text-base text-[#273c46] md:text-xl">
          Selecciona tu organización para continuar con el reporte ético
        </p>
      </div>

      <Card className="rounded-3xl border border-[#0a1e14]/10 bg-white/95 p-6 shadow-[0_20px_60px_rgba(10,30,20,0.1)] md:p-8">
        <div className="space-y-6">
          <div>
            <Input
              label="Organización"
              placeholder="Escribe al menos 3 letras del nombre de tu organización"
              value={query}
              onValueChange={(value) => {
                setQuery(value);
                setSelectedOrg(null);
              }}
              size="lg"
              radius="lg"
              classNames={{
                inputWrapper:
                  "bg-[#f7faf9] border border-[#0a1e14]/10 data-[hover=true]:border-lime-500",
                input: "text-[#0d212c]",
                label: "text-[#0a1e14] font-medium",
              }}
              startContent={
                <i
                  className="icon-[lucide--search] size-5 text-gray-400"
                  role="img"
                  aria-hidden="true"
                />
              }
              endContent={isSearching ? <Spinner size="sm" /> : null}
            />

            {!selectedOrg && results.length > 0 && (
              <div className="mt-2 space-y-1 rounded-2xl border border-[#0a1e14]/10 bg-white p-2 shadow-sm">
                {results.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrg(org);
                      setResults([]);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-lime-50"
                  >
                    {org.logoUrl ? (
                      <div className="relative flex h-6 w-6 items-center justify-center">
                        <Image
                          src={org.logoUrl}
                          alt={org.name}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <i
                        className="icon-[fluent--building-24-regular] size-6 text-gray-400"
                        role="img"
                        aria-hidden="true"
                      />
                    )}
                    <span className="text-sm font-medium text-[#0a1e14]">
                      {org.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!selectedOrg &&
              !isSearching &&
              hasSearched &&
              results.length === 0 && (
                <p className="mt-2 px-1 text-sm text-[#273c46]">
                  No encontramos una organización con este nombre.
                </p>
              )}
          </div>

          {selectedOrg && (
            <div className="rounded-2xl border border-lime-200 bg-lime-50/80 p-4">
              <div className="flex items-center space-x-4">
                {selectedOrg.logoUrl ? (
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <Image
                      src={selectedOrg.logoUrl}
                      alt={selectedOrg.name}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <i
                    className="icon-[fluent--building-24-regular] size-16 text-gray-400"
                    role="img"
                    aria-hidden="true"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-[#0a1e14]">
                    {selectedOrg.name}
                  </h3>
                  <p className="text-sm text-[#273c46]">
                    Organización seleccionada
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            size="lg"
            color="primary"
            isDisabled={!selectedOrg}
            onPress={handleContinue}
            endContent={
              <i
                className="icon-[lucide--chevron-right] size-5"
                role="img"
                aria-hidden="true"
              />
            }
            className="w-full bg-[#0a1e14] text-white data-[hover=true]:!bg-[#0f3423]"
          >
            Continuar
          </Button>

          <div className="rounded-xl border border-[#0a1e14]/10 bg-[#f7faf9] p-3">
            <p className="text-xs leading-relaxed text-[#273c46]">
              La información que envíes se procesa bajo un flujo de
              confidencialidad. Si tu organización lo permite, puedes mantener
              tu identidad en anonimato durante toda la investigación.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
