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
import { Select, SelectItem } from "@heroui/select";
import { User } from "@heroui/user";
import { assignMemberToDepartment } from "@/actions/department.actions";
import { Department } from "@/types/department.types";
import { addToast } from "@/modules/core/utils/safe-toast";

interface AssignDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    userId: string;
    userName: string;
    userEmail: string;
    currentDepartment?: string;
  };
  departments: Department[];
  onSuccess: () => void;
}

export function AssignDepartmentModal({
  isOpen,
  onClose,
  member,
  departments,
  onSuccess,
}: AssignDepartmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(
    member.currentDepartment || ""
  );

  const handleAssign = async () => {
    if (!selectedDepartment) {
      addToast({
        title: "Por favor selecciona un departamento",
        color: "danger",
      });
      return;
    }

    setLoading(true);
    try {
      await assignMemberToDepartment(member.userId, selectedDepartment);
      addToast({
        title: "Miembro asignado exitosamente",
        color: "success",
      });
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      addToast({
        title: error.message || "Error al asignar el miembro",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader>Asignar Departamento</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <User
              name={member.userName}
              description={member.userEmail}
              avatarProps={{
                name: member.userName[0],
                size: "lg",
              }}
            />

            <Select
              label="Departamento"
              placeholder="Selecciona un departamento"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              description="Los reportes del departamento serán visibles para este miembro"
            >
              {departments.map((dept) => (
                <SelectItem key={dept.id}>
                  {dept.name}
                  {dept.isDefault && " (Predeterminado)"}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={loading}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleAssign} isLoading={loading}>
            Asignar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
