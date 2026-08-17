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
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Textarea } from "@heroui/input";
import {
  assignMembersToReport,
  getAvailableMembersForAssignment,
  removeAssignmentFromReport,
  reassignReportMember,
} from "@/actions/report-assignments.actions";
import { getDepartments } from "@/actions/department.actions";
import { Department } from "@/types/department.types";
import { useSafeToast } from "../../hooks/useSafeToast";

interface AssignMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  currentAssignments?: Array<{
    userId: string;
    userName: string;
  }>;
  onSuccess: () => void;
  organizationId: string;
}

interface AvailableMember {
  userId: string;
  userName: string;
  department?: string;
  role: string;
  conflict: {
    sameDepartment: boolean;
    nameMatchesAccused: boolean;
    isReporter: boolean;
  };
}

function conflictReason(c: AvailableMember["conflict"]): string | null {
  if (c.isReporter) return "Es quien reportó este caso";
  if (c.nameMatchesAccused) return "Su nombre coincide con el de la persona reportada";
  if (c.sameDepartment) return "Pertenece al mismo departamento del caso";
  return null;
}

export function AssignMembersModal({
  isOpen,
  onClose,
  reportId,
  currentAssignments = [],
  onSuccess,
  organizationId,
}: AssignMembersModalProps) {
  const { showSuccess, showError } = useSafeToast();

  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>(
    []
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [reassigningFrom, setReassigningFrom] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [reassignToId, setReassignToId] = useState<string>("");
  const [reassignReason, setReassignReason] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reportId]);

  const loadData = async () => {
    setLoadingMembers(true);
    try {
      const [membersData, departmentsData] = await Promise.all([
        getAvailableMembersForAssignment(reportId, undefined, organizationId),
        getDepartments(organizationId),
      ]);

      setAvailableMembers(membersData as AvailableMember[]);
      setDepartments(departmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      showError("Error al cargar los miembros disponibles");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssign = async () => {
    if (selectedMembers.length === 0) {
      showError("Por favor selecciona al menos un investigador");
      return;
    }

    const conflicted = selectedMembers
      .map((id) => availableMembers.find((m) => m.userId === id))
      .filter((m): m is AvailableMember => !!m && !!conflictReason(m.conflict));

    if (conflicted.length > 0) {
      const names = conflicted.map((m) => m.userName).join(", ");
      const proceed = confirm(
        `Posible conflicto de interés con: ${names}. ¿Deseas asignarlos de todas formas?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const membersToAssign = selectedMembers.map((userId) => {
        const member = availableMembers.find((m) => m.userId === userId);
        return {
          userId,
          userName: member?.userName || "Usuario",
        };
      });

      await assignMembersToReport(reportId, membersToAssign);
      showSuccess(
        `${selectedMembers.length} investigador(es) asignado(s) exitosamente`
      );
      onSuccess();
      handleClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showError(error.message || "Error al asignar investigadores");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de remover a ${userName} de este reporte?`)) {
      return;
    }

    setRemovingUserId(userId);
    try {
      await removeAssignmentFromReport(reportId, userId);
      showSuccess(`${userName} ha sido removido del reporte`);
      // Reload data to update the lists
      await loadData();
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showError(error.message || "Error al remover investigador");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleReassign = async () => {
    if (!reassigningFrom || !reassignToId) return;
    const target = availableMembers.find((m) => m.userId === reassignToId);
    if (!target) return;

    if (!reassignReason.trim()) {
      showError("Indica un motivo para la reasignación");
      return;
    }

    setIsReassigning(true);
    try {
      await reassignReportMember(
        reportId,
        reassigningFrom.userId,
        target.userId,
        target.userName,
        reassignReason
      );
      showSuccess(`Caso reasignado a ${target.userName}`);
      setReassigningFrom(null);
      setReassignToId("");
      setReassignReason("");
      await loadData();
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showError(error.message || "Error al reasignar el caso");
    } finally {
      setIsReassigning(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setSearchTerm("");
    setSelectedDepartment("all");
    setReassigningFrom(null);
    setReassignToId("");
    setReassignReason("");
    onClose();
  };

  const filteredMembers = availableMembers.filter((member) => {
    const matchesSearch = member.userName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map((m) => m.userId));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Gestionar Investigadores</h3>
          <p className="text-sm text-slate-500 font-normal">
            Asigna o remueve investigadores de este reporte
          </p>
        </ModalHeader>
        <ModalBody>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Assignments */}
              {currentAssignments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Investigadores actuales:
                  </p>
                  <div className="space-y-2">
                    {currentAssignments.map((assignment) => (
                      <div key={assignment.userId}>
                        <div className="flex items-center justify-between p-3 bg-[#f7faf9] rounded-lg">
                          <User
                            name={assignment.userName}
                            description="Investigador asignado"
                            avatarProps={{
                              name: assignment.userName[0],
                              size: "sm",
                            }}
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="light"
                              onPress={() =>
                                setReassigningFrom(
                                  reassigningFrom?.userId === assignment.userId
                                    ? null
                                    : assignment
                                )
                              }
                              startContent={
                                <i className="icon-[lucide--repeat] size-4" />
                              }
                            >
                              Reasignar
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() =>
                                handleRemove(assignment.userId, assignment.userName)
                              }
                              isLoading={removingUserId === assignment.userId}
                              startContent={
                                !removingUserId && (
                                  <i className="icon-[lucide--x] size-4" />
                                )
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        </div>

                        {reassigningFrom?.userId === assignment.userId && (
                          <div className="mt-2 p-3 border border-sky-200 bg-sky-50/40 rounded-lg space-y-2">
                            <Select
                              label="Reasignar a"
                              placeholder="Selecciona un investigador"
                              selectedKeys={reassignToId ? [reassignToId] : []}
                              onSelectionChange={(keys) =>
                                setReassignToId(Array.from(keys)[0] as string)
                              }
                              size="sm"
                            >
                              {availableMembers.map((m) => (
                                <SelectItem key={m.userId}>
                                  {m.userName}
                                </SelectItem>
                              ))}
                            </Select>
                            <Textarea
                              label="Motivo"
                              placeholder="¿Por qué se reasigna este caso?"
                              value={reassignReason}
                              onValueChange={setReassignReason}
                              size="sm"
                              minRows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                onPress={() => setReassigningFrom(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                onPress={handleReassign}
                                isLoading={isReassigning}
                                isDisabled={!reassignToId}
                              >
                                Confirmar reasignación
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableMembers.length > 0 && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-slate-600 mb-3">
                      Asignar nuevos investigadores:
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Buscar por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      startContent={
                        <i className="icon-[lucide--search] size-4" />
                      }
                    />
                    <Select
                      placeholder="Filtrar por departamento"
                      selectedKeys={[selectedDepartment]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedDepartment(selected);
                      }}
                    >
                      {[
                        { key: "all", name: "Todos los departamentos" },
                        ...departments,
                      ].map((item) => (
                        <SelectItem key={item.name}>{item.name}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Select All */}
                  <div className="flex items-center justify-between">
                    <Checkbox
                      isSelected={
                        selectedMembers.length === filteredMembers.length &&
                        filteredMembers.length > 0
                      }
                      onValueChange={selectAll}
                    >
                      Seleccionar todos ({filteredMembers.length})
                    </Checkbox>
                    <Chip size="sm" variant="flat">
                      {selectedMembers.length} seleccionado(s)
                    </Chip>
                  </div>

                  {/* Members List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No hay más investigadores disponibles para asignar
                      </div>
                    ) : (
                      filteredMembers.map((member) => {
                        const reason = conflictReason(member.conflict);
                        return (
                          <div
                            key={member.userId}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedMembers.includes(member.userId)
                                ? "border-primary bg-primary-50"
                                : reason
                                  ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50"
                                  : "border-emerald-100 hover:bg-[#f7faf9]"
                            }`}
                            onClick={() => toggleMember(member.userId)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  isSelected={selectedMembers.includes(
                                    member.userId
                                  )}
                                  onValueChange={() =>
                                    toggleMember(member.userId)
                                  }
                                />
                                <User
                                  name={member.userName}
                                  description={
                                    member.department || "Sin departamento"
                                  }
                                  avatarProps={{
                                    name: member.userName[0],
                                    size: "sm",
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                {reason && (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color="warning"
                                    startContent={
                                      <i className="icon-[lucide--alert-triangle] size-3" />
                                    }
                                  >
                                    {reason}
                                  </Chip>
                                )}
                                <Chip size="sm" variant="flat" color="default">
                                  Investigador
                                </Chip>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {availableMembers.length === 0 &&
                currentAssignments.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No hay investigadores en la organización
                  </div>
                )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={loading}>
            Cerrar
          </Button>
          {selectedMembers.length > 0 && (
            <Button color="primary" onPress={handleAssign} isLoading={loading}>
              Asignar{" "}
              {selectedMembers.length > 0 && `(${selectedMembers.length})`}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
