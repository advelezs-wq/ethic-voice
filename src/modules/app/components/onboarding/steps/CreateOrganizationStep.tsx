"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardBody, Input, Divider, Spinner } from "@heroui/react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { OnboardingContextType } from "../OnboardingClient";
import type { OrganizationResource } from "@clerk/types";

interface CreateOrganizationStepProps {
  context: OnboardingContextType;
}

export function CreateOrganizationStep({
  context,
}: CreateOrganizationStepProps) {
  const [organizationCreated, setOrganizationCreated] = useState(false);
  const { currentOrganization } = useOrganization();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  // Handle post-creation logic when organization is detected
  useEffect(() => {
    if (currentOrganization && !organizationCreated) {
      handleOrganizationCreated({ id: currentOrganization.id } as any);
    }
  }, [currentOrganization, organizationCreated]);

  const THEME_COLORS: Record<
    string,
    | {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
      }
    | undefined
  > = {
    default: {
      primaryColor: "#0066CC",
      secondaryColor: "#4A90E2",
      accentColor: "#E3F2FD",
      backgroundColor: "#F8FAFC",
    },
    green: {
      primaryColor: "#10B981",
      secondaryColor: "#34D399",
      accentColor: "#ECFDF5",
      backgroundColor: "#F9FAFB",
    },
    purple: {
      primaryColor: "#8B5CF6",
      secondaryColor: "#A78BFA",
      accentColor: "#F3E8FF",
      backgroundColor: "#FAFAFA",
    },
    orange: {
      primaryColor: "#F59E0B",
      secondaryColor: "#FBBF24",
      accentColor: "#FEF3C7",
      backgroundColor: "#FFFBEB",
    },
    "dark-blue": {
      primaryColor: "#3B82F6",
      secondaryColor: "#60A5FA",
      accentColor: "#1F2937",
      backgroundColor: "#111827",
    },
    "dark-purple": {
      primaryColor: "#A855F7",
      secondaryColor: "#C084FC",
      accentColor: "#1F2937",
      backgroundColor: "#111827",
    },
  };

  const handleOrganizationCreated = async (org: OrganizationResource) => {
    console.log("🎉 [ONBOARDING] Organization created successfully!", org);
    setOrganizationCreated(true);
    context.setIsCreatingOrganization(true);

    try {
      // 1. Save notification settings first
      await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context.notificationSettings),
      });
      console.log("✅ [ONBOARDING] Notification settings saved");

      // 2. Link subscription if present
      const urlParams = new URLSearchParams(window.location.search);
      let subscriptionId = urlParams.get("subscription_id");
      if (!subscriptionId) {
        subscriptionId = localStorage.getItem("pendingSubscriptionId");
      }

      if (subscriptionId && org.id) {
        console.log("🔗 [ONBOARDING] Linking subscription to organization:", {
          subscriptionId,
          organizationId: org.id,
        });

        const linkResponse = await fetch(
          "/api/organization/link-subscription",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subscriptionId: parseInt(subscriptionId),
              organizationId: org.id,
            }),
          }
        );

        if (linkResponse.ok) {
          const linkResult = await linkResponse.json();
          console.log(
            "✅ [ONBOARDING] Subscription linked successfully:",
            linkResult
          );
          localStorage.removeItem("pendingSubscriptionId");
        } else {
          const error = await linkResponse.json();
          console.error("❌ [ONBOARDING] Failed to link subscription:", error);
        }
      }

      // 3. Apply selected theme now that org exists
      if (context.selectedTheme && org.id) {
        const colors = THEME_COLORS[context.selectedTheme];
        await fetch("/api/organization/settings/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: org.id,
            settings: {
              theme: context.selectedTheme,
              ...(colors || {}),
            },
          }),
        });
        console.log("🎨 [ONBOARDING] Theme applied to new organization");
      }

      // 4. Wait a moment for all operations to complete
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 5. Redirect to the organization
      console.log("🚀 [ONBOARDING] Redirecting to app dashboard");
      window.location.href = `/app`;
    } catch (error) {
      console.error("❌ [ONBOARDING] Error during organization setup:", error);

      // Still redirect even if some steps failed - don't block the user
      setTimeout(() => {
        window.location.href = `/app`;
      }, 1500);
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

  const createOrg = async () => {
    // Redirect to Super Admin client creation flow
    window.location.href = "/superadmin/clients";
  };

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {organizationCreated ? "¡Todo listo!" : "Crear tu organización"}
        </h2>
        <p className="text-gray-600">
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
              <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-600">
                <Spinner size="sm" color="success" />
                Redirigiéndote a tu espacio de trabajo...
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Summary of previous steps */}
              <div className="mb-6 bg-blue-50 rounded-lg p-4 w-full">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📋 Resumen de tu configuración
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    🎨 <strong>Tema:</strong> {context.selectedTheme}
                  </p>
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
                    💳 <strong>Suscripción:</strong> Lista para vincular a tu
                    organización
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
                  <div className="text-xs text-gray-500">
                    URL: /app/organizations/
                    <span className="font-medium">{toSlug(name)}</span>
                  </div>
                )}

                <Divider className="my-2" />

                {/* Pre-creation logo drop (stores locally, uploads after creation) */}
                <div>
                  <p className="text-sm text-gray-700 mb-2">Logo de la organización (opcional)</p>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {!previewUrl ? (
                      <label className="block cursor-pointer text-gray-600">
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

                <Button color="primary" onPress={createOrg} className="w-full">
                  Crear cliente (creará organización)
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

          <div className="text-sm text-gray-600 self-center">
            Crea tu organización para completar →
          </div>
        </div>
      )}
    </motion.div>
  );
}
