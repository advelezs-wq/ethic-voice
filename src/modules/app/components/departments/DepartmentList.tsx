"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useDisclosure } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { DepartmentWithStats } from "@/types/department.types";
import { deleteDepartment } from "@/actions/department.actions";
import { CreateDepartmentModal } from "./CreateDepartmentModal";
import { EditDepartmentModal } from "./EditDepartmentModal";

interface DepartmentListProps {
  departments: DepartmentWithStats[];
  onRefresh: () => void;
}

export function DepartmentList({
  departments,
  onRefresh,
}: DepartmentListProps) {
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentWithStats | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const createModal = useDisclosure();
  const editModal = useDisclosure();

  const handleEdit = (department: DepartmentWithStats) => {
    setSelectedDepartment(department);
    editModal.onOpen();
  };

  const handleDelete = async (departmentId: string, departmentName: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el departamento "${departmentName}"? Los miembros y reportes serán movidos al departamento General.`
      )
    ) {
      return;
    }

    setDeleting(departmentId);
    try {
      await deleteDepartment(departmentId);
      addToast({
        title: "Departamento eliminado exitosamente",
        color: "success",
      });
      onRefresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      addToast({
        title: error.message || "Error al eliminar el departamento",
        color: "danger",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Departamentos</h2>
            <p className="text-sm text-gray-600">
              Gestiona los departamentos de tu organización
            </p>
          </div>
          <Button
            color="primary"
            onPress={createModal.onOpen}
            startContent={<i className="icon-[lucide--plus] size-4" />}
          >
            Crear Departamento
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((department) => (
            <Card
              key={department.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{department.name}</h3>
                  {department.isDefault && (
                    <Chip size="sm" color="primary" variant="flat">
                      Predeterminado
                    </Chip>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Miembros</p>
                      <p className="font-bold">{department.memberCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Reportes Total</p>
                      <p className="font-bold">{department.reportCount}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pendientes</span>
                      <span className="font-medium text-yellow-600">
                        {department.pendingReports}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">En Progreso</span>
                      <span className="font-medium text-blue-600">
                        {department.inProgressReports}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Resueltos</span>
                      <span className="font-medium text-green-600">
                        {department.resolvedReports}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleEdit(department)}
                      isDisabled={department.isDefault}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() =>
                        handleDelete(department.id, department.name)
                      }
                      isDisabled={
                        department.isDefault || deleting === department.id
                      }
                      isLoading={deleting === department.id}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <CreateDepartmentModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onSuccess={() => {
          createModal.onClose();
          onRefresh();
        }}
      />

      {selectedDepartment && (
        <EditDepartmentModal
          isOpen={editModal.isOpen}
          onClose={editModal.onClose}
          department={selectedDepartment}
          onSuccess={() => {
            editModal.onClose();
            onRefresh();
          }}
        />
      )}
    </>
  );
}
