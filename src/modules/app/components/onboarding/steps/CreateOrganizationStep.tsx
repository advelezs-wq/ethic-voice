"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Input, Divider, Spinner } from "@heroui/react";
import { OnboardingContextType } from "../OnboardingClient";

interface CreateOrganizationStepProps {
  context: OnboardingContextType;
}

export function CreateOrganizationStep({
  context,
}: CreateOrganizationStepProps) {
  const [organizationCreated, setOrganizationCreated] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const [error, setError] = useState<{ message: string; toPricing: boolean } | null>(null);
  const [creating, setCreating] = useState(false);

  // Crea la organización del cliente (el servidor le vincula el plan pagado),
  // sube el logo si lo eligió y guarda sus preferencias de notificación.
  const createOrg = async () => {
    setError(null);
    setCreating(true);
    context.setIsCreatingOrganization(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: data?.error || "No se pudo crear la organización.", toPricing: res.status === 402 });
        return;
      }
      const orgId: string = data.organization.id;
      setOrganizationCreated(true);
      document.cookie = `ev_org=${orgId}; path=/; max-age=${60 * 60 * 24 * 30}`;

      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        fd.append("organizationId", orgId);
        await fetch("/api/organization/logo/upload", { method: "POST", body: fd }).catch(() => undefined);
      }
      await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context.notificationSettings),
      }).catch(() => undefined);
      localStorage.removeItem("pendingSubscriptionId");

      window.location.href = "/app";
    } catch {
      setError({ message: "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.", toPricing: false });
    } finally {
      setCreating(false);
      context.setIsCreatingOrganization(false);
    }
  };

  const toSlug = (v: string) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

  useEffect(() => {
    if (!slugEdited) {
      setSlug(toSlug(name));
    }
  }, [name, slugEdited]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{organizationCreated ? "✅" : "🏢"}</span>
        </div>
        <h2 className="text-2xl font-bold text-ev-night mb-2">
          {organizationCreated ? "¡Todo listo!" : "Crear tu organización"}
        </h2>
        <p className="text-slate-500">
          {organizationCreated
            ? "Finalizando configuración y llevándote a la plataforma..."
            : "Último paso: crea tu organización para acceder a todas las funcionalidades"}
        </p>
      </div>

      {/* Organization Creation */}
      <Card>
        <CardBody className="p-6">
          {organizationCreated ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">
                ¡Configuración completada!
              </h3>
              <p className="text-green-700 mb-4">
                Tu organización ha sido creada y tu suscripción vinculada
              </p>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">
                  ✓ Tema personalizado aplicado
                  <br />
                  ✓ Notificaciones configuradas
                  <br />
                  ✓ Organización creada
                  <br />
                  ✓ Suscripción activada
                  <br />✓ Acceso completo activado
                </p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-500">
                <Spinner size="sm" color="success" />
                Redirigiéndote a tu espacio de trabajo...
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Summary of previous steps */}
              <div className="mb-6 bg-sky-50 rounded-lg p-4 w-full">
                <h3 className="font-semibold text-sky-800 mb-2">
                  📋 Resumen de tu configuración
                </h3>
                <div className="text-sm text-sky-700 space-y-1">
                  <p>
                    🔔 <strong>Notificaciones:</strong>{" "}
                    {
                      Object.values(context.notificationSettings).filter(
                        Boolean
                      ).length
                    }{" "}
                    opciones activadas
                  </p>
                  <p>
                    💳 <strong>Suscripción:</strong> se vincula automáticamente a
                    tu organización
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md space-y-4">
                <Input
                  label="Nombre de la organización"
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setName(newName);
                    if (!slugEdited) setSlug(toSlug(newName));
                  }}
                />
                {/* Slug oculto en UI: lo generará el backend; mostramos una vista previa solo informativa */}
                {name && (
                  <div className="text-xs text-slate-400">
                    Tu formulario de denuncias quedará en: /submit/
                    <span className="font-medium">{toSlug(name)}</span>
                  </div>
                )}

                <Divider className="my-2" />

                {/* Pre-creation logo drop (stores locally, uploads after creation) */}
                <div>
                  <p className="text-sm text-slate-600 mb-2">Logo de la organización (opcional)</p>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {!previewUrl ? (
                      <label className="block cursor-pointer text-slate-500">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setLogoFile(f);
                            setPreviewUrl(f ? URL.createObjectURL(f) : null);
                          }}
                        />
                        Arrastra una imagen o haz clic para seleccionar
                      </label>
                    ) : (
                      <div className="space-y-2">
                        <img src={previewUrl} alt="preview" className="max-h-24 mx-auto" />
                        <div className="flex gap-2 justify-center">
                          <Button size="sm" variant="flat" onPress={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>Cambiar</Button>
                          <Button size="sm" variant="flat" color="danger" onPress={() => { setLogoFile(null); setPreviewUrl(null); }}>Quitar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#F0B2A6] bg-[#FCEEEB] p-3 text-sm text-[#862B1D]">
                    <p>{error.message}</p>
                    {error.toPricing && (
                      <a href="/pricing" className="mt-1 inline-block font-medium underline">
                        Ver planes
                      </a>
                    )}
                  </div>
                )}
                <Button
                  color="primary"
                  onPress={createOrg}
                  isLoading={creating}
                  isDisabled={name.trim().length < 2}
                  className="w-full"
                >
                  Crear mi organización
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Navigation */}
      {!organizationCreated && (
        <div className="flex gap-4 justify-between mt-6">
          <Button
            variant="bordered"
            onPress={context.goToPreviousStep}
            className="px-8"
          >
            Anterior
          </Button>

          <div className="text-sm text-slate-500 self-center">
            Crea tu organización para completar →
          </div>
        </div>
      )}
    </motion.div>
  );
}
