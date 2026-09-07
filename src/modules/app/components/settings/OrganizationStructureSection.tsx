"use client";

import { useEffect, useState } from "react";
import { Button, Input, Switch } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";

interface OptionRow {
  id: string;
  label: string;
  isActive: boolean;
}

interface OrganizationStructureSectionProps {
  organizationId: string;
}

function OptionList({
  title,
  description,
  kind,
  organizationId,
}: {
  title: string;
  description: string;
  kind: "areas" | "positions";
  organizationId: string;
}) {
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const itemKey = kind === "areas" ? "area" : "position";
  const listKey = kind;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/organization/${organizationId}/${kind}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setOptions(data[listKey] || []);
      } catch {
        addToast({
          title: "Error",
          description: `No se pudo cargar ${title.toLowerCase()}`,
          color: "danger",
        });
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, kind]);

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/organization/${organizationId}/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setOptions((prev) => [...prev, data[itemKey]]);
      setNewLabel("");
    } catch {
      addToast({ title: "Error", description: "No se pudo agregar", color: "danger" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive } : o))
    );
    try {
      const res = await fetch(
        `/api/organization/${organizationId}/${kind}/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        }
      );
      if (!res.ok) throw new Error("failed");
    } catch {
      setOptions((prev) =>
        prev.map((o) => (o.id === id ? { ...o, isActive: !isActive } : o))
      );
      addToast({
        title: "Error",
        description: "No se pudo actualizar",
        color: "danger",
      });
    }
  };

  const handleRename = async (id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(
        `/api/organization/${organizationId}/${kind}/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: trimmed }),
        }
      );
      if (!res.ok) throw new Error("failed");
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo renombrar",
        color: "danger",
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <h4 className="text-base font-semibold text-[#0d212c]">{title}</h4>
      <p className="text-sm text-slate-500 mb-4">{description}</p>

      {isLoading ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : (
        <div className="space-y-2">
          {options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2"
            >
              <Input
                size="sm"
                defaultValue={option.label}
                onBlur={(e) => handleRename(option.id, e.target.value)}
                className="flex-1"
                aria-label={`Nombre de ${title.toLowerCase()}`}
              />
              <Switch
                size="sm"
                isSelected={option.isActive}
                onValueChange={(val) => handleToggle(option.id, val)}
                aria-label={option.isActive ? "Activo" : "Inactivo"}
              />
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <Input
              size="sm"
              placeholder={`Agregar ${title.toLowerCase().slice(0, -1) || title.toLowerCase()}...`}
              value={newLabel}
              onValueChange={setNewLabel}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <Button
              size="sm"
              color="primary"
              onPress={handleAdd}
              isLoading={isSaving}
              isDisabled={!newLabel.trim()}
            >
              Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrganizationStructureSection({
  organizationId,
}: OrganizationStructureSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Estas opciones se muestran a los denunciantes cuando identifican al
        área o cargo de la persona denunciada. Desactivar una opción solo
        afecta a nuevas denuncias — las denuncias existentes no se modifican.
      </p>
      <OptionList
        title="Áreas de la organización"
        description="Ej. Administración, Compras, Finanzas, Talento Humano, Operaciones, Comercial, Auditoría Interna."
        kind="areas"
        organizationId={organizationId}
      />
      <OptionList
        title="Cargos o puestos"
        description="Ej. Colaborador, Coordinador, Jefe, Director, Gerente, Vicepresidente."
        kind="positions"
        organizationId={organizationId}
      />
    </div>
  );
}
