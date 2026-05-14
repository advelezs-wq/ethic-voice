"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Select, SelectItem } from "@heroui/select";
import { Image } from "@heroui/react";
import { Organization } from "@prisma/client";
import { useRouter } from "next/navigation";

interface OrganizationSelectorProps {
  organizations: Organization[];
  onSelect: (org: Organization) => void;
}

export function OrganizationSelector({
  organizations,
  onSelect,
}: OrganizationSelectorProps) {
  const [selected, setSelected] = useState<string>("");
  const router = useRouter();

  const handleContinue = () => {
    const org = organizations.find((o) => o.id === selected);
    if (org) onSelect(org);
  };

  const selectedOrg = organizations.find((o) => o.id === selected);

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
          <Select
            label="Organización"
            placeholder="Busca y selecciona tu organización"
            selectedKeys={selected ? [selected] : []}
            onSelectionChange={(keys) =>
              setSelected(Array.from(keys)[0] as string)
            }
            size="lg"
            radius="lg"
            classNames={{
              trigger:
                "bg-[#f7faf9] border border-[#0a1e14]/10 data-[hover=true]:border-lime-500",
              value: "text-[#0d212c]",
              label: "text-[#0a1e14] font-medium",
            }}
            startContent={
              selectedOrg?.logoUrl ? (
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Image
                    src={selectedOrg.logoUrl}
                    alt={selectedOrg.name}
                    className="object-contain"
                  />
                </div>
              ) : (
                <i
                  className="icon-[fluent--building-24-regular] size-6 text-gray-400"
                  role="img"
                  aria-hidden="true"
                />
              )
            }
          >
            {organizations.map((org) => (
              <SelectItem
                key={org.id}
                startContent={
                  org.logoUrl ? (
                    <div className="relative w-6 h-6 flex items-center justify-center">
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
                  )
                }
              >
                {org.name}
              </SelectItem>
            ))}
          </Select>

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
            isDisabled={!selected}
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
