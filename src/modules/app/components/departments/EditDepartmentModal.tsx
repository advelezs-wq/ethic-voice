"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { updateDepartment } from "@/actions/department.actions";
import { DepartmentWithStats } from "@/types/department.types";
import { addToast } from "@/modules/core/utils/safe-toast";

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentWithStats;
  onSuccess: () => void;
}

export function EditDepartmentModal({
  isOpen,
  onClose,
  department,
  onSuccess,
}: EditDepartmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(department.name);

  useEffect(() => {
    setName(department.name);
  }, [department]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      addToast({
        title: "Por favor ingresa un nombre para el departamento",
        color: "danger",
      });
      return;
    }

    if (name.trim() === department.name) {
      addToast({
        title: "No hay cambios que guardar",
        color: "default",
      });
      return;
    }

    setLoading(true);
    try {
      await updateDepartment(department.id, {
        name: name.trim(),
      });
      addToast({
        title: "Departamento actualizado exitosamente",
        color: "success",
      });
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      addToast({
        title: error.message || "Error al actualizar el departamento",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Editar Departamento</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nombre del Departamento"
              placeholder="Ej: Recursos Humanos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
            />

            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Información del Departamento:
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• {department.memberCount} miembros asignados</p>
                <p>• {department.reportCount} reportes totales</p>
                <p>• {department.pendingReports} reportes pendientes</p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleUpdate} isLoading={loading}>
            Guardar Cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
