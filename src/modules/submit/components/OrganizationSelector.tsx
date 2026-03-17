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
    <div className="container max-w-2xl mx-auto px-4 py-20">
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
        className="group mb-4"
      >
        Volver
      </Button>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Seleccionar Organización
        </h1>
        <p className="text-xl text-gray-600">
          Selecciona tu organización para continuar con el reporte ético
        </p>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <Select
            label="Organización"
            placeholder="Busca y selecciona tu organización"
            selectedKeys={selected ? [selected] : []}
            onSelectionChange={(keys) =>
              setSelected(Array.from(keys)[0] as string)
            }
            size="lg"
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
            <div className="p-4 bg-gray-50 rounded-lg">
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
                  <h3 className="font-semibold text-lg">{selectedOrg.name}</h3>
                  <p className="text-sm text-gray-600">
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
            className="w-full"
          >
            Continuar
          </Button>
        </div>
      </Card>
    </div>
  );
}
