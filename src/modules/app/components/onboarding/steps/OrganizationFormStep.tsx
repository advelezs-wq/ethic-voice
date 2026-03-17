"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
} from "@heroui/react";
import { OnboardingContextType } from "../OnboardingClient";

interface OrganizationFormStepProps {
  context: OnboardingContextType;
}

interface FormData {
  organizationName: string;
  description: string;
  organizationType: string;
  teamSize: string;
}

const organizationTypes = [
  { key: "empresa", label: "Empresa" },
  { key: "startup", label: "Startup" },
  { key: "ong", label: "ONG" },
  { key: "gobierno", label: "Gobierno" },
  { key: "educacion", label: "Educación" },
  { key: "salud", label: "Salud" },
  { key: "otro", label: "Otro" },
];

const teamSizes = [
  { key: "1-10", label: "1-10 empleados" },
  { key: "11-50", label: "11-50 empleados" },
  { key: "51-200", label: "51-200 empleados" },
  { key: "201-500", label: "201-500 empleados" },
  { key: "500+", label: "Más de 500 empleados" },
];

export function OrganizationFormStep({ context }: OrganizationFormStepProps) {
  const {
    goToNextStep,
    goToPreviousStep,
    organizationData,
    setOrganizationData,
  } = context;

  const [formData, setFormData] = useState<FormData>({
    organizationName: organizationData?.organizationName || "",
    description: organizationData?.description || "",
    organizationType: organizationData?.organizationType || "",
    teamSize: organizationData?.teamSize || "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "El nombre de la organización es requerido";
    }

    if (!formData.organizationType) {
      newErrors.organizationType = "Selecciona el tipo de organización";
    }

    if (!formData.teamSize) {
      newErrors.teamSize = "Selecciona el tamaño del equipo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setOrganizationData(formData);
      goToNextStep();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏢</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información de tu organización
        </h2>
        <p className="text-gray-600">
          Cuéntanos sobre tu organización para personalizar tu experiencia
        </p>
      </div>

      {/* Form */}
      <Card className="max-w-2xl mx-auto">
        <CardBody className="p-6 space-y-6">
          {/* Organization Name */}
          <div>
            <Input
              label="Nombre de la organización"
              placeholder="Ej: Mi Empresa S.A."
              value={formData.organizationName}
              onValueChange={(value) =>
                handleInputChange("organizationName", value)
              }
              isInvalid={!!errors.organizationName}
              errorMessage={errors.organizationName}
              variant="bordered"
              size="lg"
              classNames={{
                input: "text-gray-900",
                label: "text-gray-700 font-medium",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Descripción (opcional)"
              placeholder="Describe brevemente tu organización..."
              value={formData.description}
              onValueChange={(value) => handleInputChange("description", value)}
              variant="bordered"
              minRows={3}
              maxRows={5}
              classNames={{
                input: "text-gray-900",
                label: "text-gray-700 font-medium",
              }}
            />
          </div>

          {/* Organization Type */}
          <div>
            <Select
              label="Tipo de organización"
              placeholder="Selecciona el tipo"
              selectedKeys={
                formData.organizationType ? [formData.organizationType] : []
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleInputChange("organizationType", value);
              }}
              isInvalid={!!errors.organizationType}
              errorMessage={errors.organizationType}
              variant="bordered"
              size="lg"
              classNames={{
                label: "text-gray-700 font-medium",
                value: "text-gray-900",
              }}
            >
              {organizationTypes.map((type) => (
                <SelectItem key={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Team Size */}
          <div>
            <Select
              label="Tamaño del equipo"
              placeholder="¿Cuántas personas trabajan en tu organización?"
              selectedKeys={formData.teamSize ? [formData.teamSize] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleInputChange("teamSize", value);
              }}
              isInvalid={!!errors.teamSize}
              errorMessage={errors.teamSize}
              variant="bordered"
              size="lg"
              classNames={{
                label: "text-gray-700 font-medium",
                value: "text-gray-900",
              }}
            >
              {teamSizes.map((size) => (
                <SelectItem key={size.key}>
                  {size.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between max-w-2xl mx-auto">
        <Button variant="bordered" onPress={goToPreviousStep} className="px-8">
          Anterior
        </Button>

        <Button color="primary" onPress={handleNext} className="px-8">
          Continuar
        </Button>
      </div>
    </motion.div>
  );
}
