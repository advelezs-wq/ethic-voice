"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
// import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { addToast } from "@/modules/core/utils/safe-toast";
import { useOrganization as useOrgStore } from "@/modules/app/hooks/useOrganization";

interface EnhancedInviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentMembersCount: number;
  currentAdminsCount: number;
  maxUsers: number;
  maxInvestigators: number;
  planType: string;
}

interface InviteMemberForm {
  email: string;
  role: "ADMIN" | "MEMBER";
}

export function EnhancedInviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  currentMembersCount,
  currentAdminsCount,
  maxUsers,
  maxInvestigators,
  planType,
}: EnhancedInviteMemberModalProps) {
  const { currentOrganization } = useOrgStore();
  const [form, setForm] = useState<InviteMemberForm>({
    email: "",
    role: "MEMBER",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmailDomain = (email: string): boolean => {
    // Basic domain validation - can be enhanced with specific business rules
    const domain = email.split("@")[1]?.toLowerCase();

    // Block common temporary email domains
    const tempDomains = [
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "tempmail.org",
    ];

    if (tempDomains.includes(domain)) {
      setEmailError("No se permiten correos electrónicos temporales");
      return false;
    }

    return true;
  };

  const checkPlanLimits = (role: "ADMIN" | "MEMBER"): boolean => {
    if (role === "ADMIN") {
      if (currentAdminsCount >= maxUsers) {
        addToast({
          title: "Límite de administradores alcanzado",
          description: `Tu plan ${planType} permite máximo ${maxUsers} administrador${maxUsers > 1 ? "es" : ""}. Actualiza tu plan para agregar más.`,
          color: "warning",
        });
        return false;
      }
    } else {
      // -1 means unlimited investigators
      if (maxInvestigators !== -1 && currentMembersCount >= maxInvestigators) {
        addToast({
          title: "Límite de investigadores alcanzado",
          description: `Tu plan ${planType} permite máximo ${maxInvestigators} investigador${maxInvestigators > 1 ? "es" : ""}. Actualiza tu plan para agregar más.`,
          color: "warning",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    // Reset error state
    setEmailError("");

    // Check if organization is available from store
    if (!currentOrganization?.id) {
      addToast({
        title: "Error",
        description:
          "La organización no está disponible. Por favor, intenta nuevamente.",
        color: "danger",
      });
      return;
    }

    // Validate email
    if (!form.email.trim()) {
      setEmailError("El correo electrónico es requerido");
      return;
    }

    if (!validateEmail(form.email)) {
      setEmailError("Por favor ingresa un correo electrónico válido");
      return;
    }

    if (!validateEmailDomain(form.email)) {
      return;
    }

    // Check plan limits
    if (!checkPlanLimits(form.role)) {
      return;
    }

    setIsLoading(true);

    try {
      // Call platform API to create a DB-backed invitation
      const res = await fetch(
        `/api/organization/${currentOrganization.id}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.toLowerCase().trim(),
            role: form.role,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.error || err.message || "No se pudo enviar la invitación"
        );
      }

      addToast({
        title: "¡Invitación enviada exitosamente!",
        description: `Se ha enviado una invitación a ${form.email} como ${form.role === "ADMIN" ? "Administrador" : "Investigador"}. Recibirá un correo con las instrucciones para unirse.`,
        color: "success",
      });

      // Reset form and close modal
      setForm({ email: "", role: "MEMBER" });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error inviting member:", error);
      addToast({
        title: "Error al enviar invitación",
        description:
          error?.message ||
          "Ha ocurrido un error inesperado. Intenta nuevamente.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ email: "", role: "MEMBER" });
    setEmailError("");
    onClose();
  };

  const getRoleDescription = (role: "ADMIN" | "MEMBER") => {
    return role === "ADMIN"
      ? "Puede gestionar la organización, miembros, configuraciones y ver todos los reportes"
      : "Puede ver y gestionar reportes asignados, pero no puede gestionar la organización";
  };

  const getAvailableSlots = (role: "ADMIN" | "MEMBER") => {
    if (role === "ADMIN") {
      const remaining = Math.max(maxUsers - currentAdminsCount, 0);
      return remaining;
    }
    // Investigators
    if (maxInvestigators === -1) return "∞";
    const remaining = Math.max(maxInvestigators - currentMembersCount, 0);
    return remaining;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Invitar Nuevo Miembro</h2>
          <p className="text-sm text-gray-600 font-normal">
            Invita a un nuevo miembro a tu organización y asigna su rol
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Plan Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="icon-[lucide--info] size-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Plan {planType}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Administradores:</span>
                  <span className="ml-1 font-medium">
                    {currentAdminsCount}/{maxUsers}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Investigadores:</span>
                  <span className="ml-1 font-medium">
                    {currentMembersCount}/{maxInvestigators === -1 ? "∞" : maxInvestigators}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <Input
              label="Correo Electrónico"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, email: e.target.value }));
                setEmailError("");
              }}
              placeholder="ejemplo@empresa.com"
              isInvalid={!!emailError}
              errorMessage={emailError}
              startContent={
                <i className="icon-[lucide--mail] size-4 text-gray-400" />
              }
            />

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Rol del usuario
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    form.role === "ADMIN"
                      ? "border-primary bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, role: "ADMIN" }))
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Administrador</span>
                    <Chip
                      color="primary"
                      size="sm"
                      variant={form.role === "ADMIN" ? "solid" : "flat"}
                    >
                      {getAvailableSlots("ADMIN")} disponibles
                    </Chip>
                  </div>
                  <p className="text-xs text-gray-600">
                    {getRoleDescription("ADMIN")}
                  </p>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    form.role === "MEMBER"
                      ? "border-primary bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, role: "MEMBER" }))
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Investigador</span>
                    <Chip
                      color="secondary"
                      size="sm"
                      variant={form.role === "MEMBER" ? "solid" : "flat"}
                    >
                      {getAvailableSlots("MEMBER")} disponibles
                    </Chip>
                  </div>
                  <p className="text-xs text-gray-600">
                    {getRoleDescription("MEMBER")}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Role Summary */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <i className="icon-[lucide--user-check] size-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  Se enviará invitación como{" "}
                  <span className="font-medium">
                    {form.role === "ADMIN" ? "Administrador" : "Investigador"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!form.email.trim()}
          >
            {isLoading ? "Enviando..." : "Enviar Invitación"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
