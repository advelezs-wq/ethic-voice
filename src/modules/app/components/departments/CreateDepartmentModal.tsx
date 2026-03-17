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
import { Select, SelectItem } from "@heroui/select";
import { createDepartment } from "@/actions/department.actions";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { DEFAULT_DEPARTMENTS } from "@/types/department.types";
import { addToast } from "@/modules/core/utils/safe-toast";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDepartmentModalProps) {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customName, setCustomName] = useState("");

  const handleCreate = async () => {
    if (!organizationId) return;

    const name = selectedTemplate === "custom" ? customName : selectedTemplate;

    if (!name.trim()) {
      addToast({
        title: "Por favor ingresa un nombre para el departamento",
        color: "danger",
      });
      return;
    }

    setLoading(true);
    try {
      await createDepartment(organizationId, {
        name: name.trim(),
      });
      addToast({
        title: "Departamento creado exitosamente",
        color: "success",
      });
      onSuccess();
      setSelectedTemplate("");
      setCustomName("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      addToast({
        title: error.message || "Error al crear el departamento",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create all select items dynamically
  const selectItems = [
    ...DEFAULT_DEPARTMENTS.filter((dept) => !dept.isDefault).map((dept) => ({
      key: dept.name,
      label: dept.name,
    })),
    {
      key: "custom",
      label: "Departamento Personalizado",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center" size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Crear Nuevo Departamento</h3>
          <p className="text-sm text-gray-600 font-normal">
            Selecciona un departamento predefinido o crea uno personalizado
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Selecciona un departamento"
              placeholder="Elige un departamento predefinido"
              selectedKeys={selectedTemplate ? [selectedTemplate] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedTemplate(selected || "");
                if (selected !== "custom") {
                  setCustomName("");
                }
              }}
            >
              {selectItems.map((item) => (
                <SelectItem key={item.key}>{item.label}</SelectItem>
              ))}
            </Select>

            {selectedTemplate === "custom" && (
              <Input
                label="Nombre del Departamento"
                placeholder="Ej: Innovación y Desarrollo"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                isRequired
              />
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Los miembros nuevos serán asignados
                automáticamente al departamento &quot;General&quot; si no se
                especifica otro departamento.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleCreate} isLoading={loading}>
            Crear Departamento
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
