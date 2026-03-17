"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { PlanType, PLAN_CONFIGS } from "@/types/subscription.types";
import { addToast } from "@/modules/core/utils/safe-toast";
import { OrganizationLogoDropzone } from "@/modules/app/components/organization/OrganizationLogoDropzone";

export default function ManualClientCreator() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [plan, setPlan] = useState<PlanType>(PlanType.GROW);
  const [saving, setSaving] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const planOptions = [
    PlanType.STARTER,
    PlanType.GROW,
    PlanType.GROW_PRO,
    PlanType.PREMIUM,
  ];

  const uploadLogoIfNeeded = async (organizationId: string) => {
    if (!logoFile) return;
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", logoFile);
      formData.append("organizationId", organizationId);

      const response = await fetch("/api/organization/logo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({} as any));
        throw new Error(error?.error || "No se pudo subir el logo");
      }

      addToast({
        title: "Logo cargado",
        description: "El logo de la organización fue subido correctamente",
        color: "success",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al subir el logo";
      addToast({ title: "Error", description: msg, color: "danger" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setResultUrl(null);
    try {
      const res = await fetch("/api/superadmin/manual-create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          organizationName: orgName,
          planType: plan,
          inviteInstead: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creating client");
      const orgId = data.organizationId as string | undefined;
      setCreatedOrgId(orgId || null);
      if (orgId) {
        await uploadLogoIfNeeded(orgId);
      }
      setResultUrl(`/app`);
      setTempPassword(data.tempPassword || null);

      addToast({
        title: "Cliente creado",
        description: "Se creó el cliente y su organización correctamente",
        color: "success",
      });
    } catch (err) {
      const msg = (err as Error).message || "Error desconocido";
      addToast({
        title: "Error al crear cliente",
        description: msg,
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Crear Cliente Manualmente</h1>
      <Card>
        <CardBody className="space-y-4">
          <Input
            label="Nombre del cliente"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email del cliente"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Nombre de la organización"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm text-gray-700">Logo de la organización (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (!file) {
                  setLogoFile(null);
                  return;
                }
                if (!file.type.startsWith("image/")) {
                  addToast({
                    title: "Archivo no válido",
                    description: "Selecciona un archivo de imagen (PNG, JPG, JPEG, SVG, GIF)",
                    color: "danger",
                  });
                  e.currentTarget.value = "";
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  addToast({
                    title: "Archivo muy grande",
                    description: "El archivo debe ser menor a 5MB",
                    color: "danger",
                  });
                  e.currentTarget.value = "";
                  return;
                }
                setLogoFile(file);
              }}
            />
            <p className="text-xs text-gray-500">Formatos: PNG, JPG, JPEG, SVG o GIF. Máx 5MB.</p>
          </div>
          {/* Invitación por email: el usuario definirá su contraseña al aceptar */}
          <Select
            label="Plan"
            selectedKeys={new Set([plan])}
            onSelectionChange={(keys) =>
              setPlan(Array.from(keys)[0] as PlanType)
            }
          >
            {planOptions.map((p) => (
              <SelectItem key={p}>{PLAN_CONFIGS[p].displayName}</SelectItem>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              color="primary"
              isLoading={saving || uploadingLogo}
              onPress={handleCreate}
              startContent={<i className="icon-[tabler--user-plus] size-4" />}
            >
              Crear
            </Button>
          </div>
          {resultUrl && (
            <div className="text-sm text-green-700 space-y-2">
              <div>
                Cliente creado.{" "}
                <a className="underline" href={resultUrl}>
                  Ir a la organización
                </a>
              </div>
              {createdOrgId && (
                <div className="space-y-3">
                  <p className="text-gray-700">
                    Sube el logo ahora usando el mismo componente de configuración:
                  </p>
                  <OrganizationLogoDropzone
                    organizationId={createdOrgId}
                    currentLogo={undefined}
                    onLogoUpdated={() => {
                      addToast({
                        title: "Logo actualizado",
                        description: "El logo se actualizó correctamente",
                        color: "success",
                      });
                    }}
                    onLogoRemoved={() => {
                      addToast({
                        title: "Logo eliminado",
                        description: "El logo fue eliminado",
                        color: "success",
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
