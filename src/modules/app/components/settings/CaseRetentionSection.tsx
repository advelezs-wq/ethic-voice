"use client";

import { useEffect, useState } from "react";
import { Input, Switch, Button, Chip } from "@heroui/react";
import {
  getCaseRetentionPolicy,
  updateCaseRetentionPolicy,
  getCasesPendingRetentionReview,
  type RetentionPendingCase,
} from "@/actions/retention.actions";
import { useSafeToast } from "../../hooks/useSafeToast";
import Link from "next/link";

export function CaseRetentionSection() {
  const { showSuccess, showError } = useSafeToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [days, setDays] = useState<string>("");
  const [autoDelete, setAutoDelete] = useState(false);
  const [pending, setPending] = useState<RetentionPendingCase[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [policy, pendingCases] = await Promise.all([
          getCaseRetentionPolicy(),
          getCasesPendingRetentionReview(),
        ]);
        setDays(policy.caseRetentionDays ? String(policy.caseRetentionDays) : "");
        setAutoDelete(policy.autoDeleteOnRetentionExpiry);
        setPending(pendingCases);
      } catch {
        showError("No se pudo cargar la política de retención");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    const parsed = days.trim() ? parseInt(days, 10) : null;
    if (days.trim() && (!Number.isFinite(parsed) || (parsed as number) <= 0)) {
      showError("Ingresa un número de días válido, o déjalo vacío para retención indefinida");
      return;
    }
    setIsSaving(true);
    try {
      await updateCaseRetentionPolicy({
        caseRetentionDays: parsed,
        autoDeleteOnRetentionExpiry: autoDelete,
      });
      showSuccess("Política de retención actualizada");
    } catch (e) {
      showError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-400 py-4">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Días de retención tras el cierre de un caso"
          placeholder="Vacío = conservar indefinidamente"
          value={days}
          onValueChange={setDays}
          type="number"
          min={1}
          description="Cuenta desde la fecha de cierre aprobado. Los casos con legal hold nunca se ven afectados por esta política, sin importar el valor."
        />

        <div className="flex items-start justify-between gap-4 p-4 bg-[#f7faf9] rounded-xl border border-emerald-100">
          <div>
            <p className="text-sm font-medium text-[#0d212c]">
              Eliminar automáticamente al vencer la retención
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Si está desactivado (recomendado), los casos vencidos solo se
              listan abajo para que un administrador los revise y elimine
              manualmente. Si lo activas, se eliminan solos todos los días
              vía el proceso automático — sin confirmación posterior.
            </p>
          </div>
          <Switch
            isSelected={autoDelete}
            onValueChange={setAutoDelete}
            isDisabled={!days.trim()}
          />
        </div>

        <Button color="primary" onPress={handleSave} isLoading={isSaving}>
          Guardar política
        </Button>
      </div>

      <div className="border-t border-emerald-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-[#0d212c]">
            Casos pendientes de revisión de retención
          </h4>
          {pending.length > 0 && (
            <Chip size="sm" color="warning" variant="flat">
              {pending.length}
            </Chip>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">
            No hay casos vencidos pendientes de revisión.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((c) => (
              <Link
                key={c.id}
                href={`/app/reports/${c.id}`}
                className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <span className="text-sm text-amber-900 font-mono">
                  REP-{c.trackingToken}
                </span>
                <span className="text-xs text-amber-700">
                  {c.type || "Sin categoría"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
