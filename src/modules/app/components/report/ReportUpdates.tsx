/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ReportUpdate } from "@/types/reports";
import React, { useState, useEffect, useCallback } from "react";
import { calculateDaysOverdue, formatDate, isOverdue } from "../../utils/reports";
import {
  getReportUpdates,
  createReportUpdate,
  updateReportUpdate,
  deleteReportUpdate,
} from "@/actions/reports.actions";
import { FormSubmission } from "@/types/reports";
import { useSafeToast } from "../../hooks/useSafeToast";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
} from "@heroui/react";

interface ReportUpdatesProps {
  reportId: number;
  report: FormSubmission;
}

type UpdateStatus = "pending" | "in_progress" | "completed";
type UpdatePriority = "low" | "medium" | "high";

interface UpdateForm {
  title: string;
  description: string;
  priority: UpdatePriority;
  dueDate: string;
  assignedTo: string;
  status?: UpdateStatus;
}

const STATUS_CONFIG: Record<
  UpdateStatus,
  { label: string; color: "default" | "warning" | "success"; icon: string }
> = {
  pending: { label: "Pendiente", color: "default", icon: "icon-[lucide--clock]" },
  in_progress: { label: "En progreso", color: "warning", icon: "icon-[lucide--circle-dot]" },
  completed: { label: "Completada", color: "success", icon: "icon-[lucide--circle-check]" },
};

const PRIORITY_CONFIG: Record<
  UpdatePriority,
  { label: string; color: "default" | "warning" | "danger" }
> = {
  low: { label: "Baja", color: "default" },
  medium: { label: "Media", color: "warning" },
  high: { label: "Alta", color: "danger" },
};

const EMPTY_FORM: UpdateForm = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
  status: "pending",
};

export const ReportUpdates: React.FC<ReportUpdatesProps> = ({ reportId, report }) => {
  const [updates, setUpdates] = useState<ReportUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ReportUpdate | null>(null);
  const [form, setForm] = useState<UpdateForm>(EMPTY_FORM);

  /* modals */
  const formDisc = useDisclosure(); // add/edit form modal
  const deleteDisc = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<ReportUpdate | null>(null);

  const { showSuccess, showError } = useSafeToast();
  const isReportClosed = report.status === "CLOSED" || report.status === "RESOLVED";

  const loadUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getReportUpdates(reportId);
      /* ReportUpdates tab only shows root-level (non-task) updates */
      setUpdates(data.filter((u: any) => !u.parentId));
    } catch {
      showError("No se pudieron cargar las actualizaciones");
    } finally {
      setIsLoading(false);
    }
  }, [reportId, showError]);

  useEffect(() => { loadUpdates(); }, [loadUpdates]);

  /* ── open add form ── */
  const openAdd = () => {
    setEditingUpdate(null);
    setForm(EMPTY_FORM);
    formDisc.onOpen();
  };

  /* ── open edit form ── */
  const openEdit = (u: ReportUpdate) => {
    setEditingUpdate(u);
    setForm({
      title: u.title,
      description: u.description,
      priority: (u.priority as UpdatePriority) || "medium",
      dueDate: u.dueDate
        ? new Date(u.dueDate).toISOString().slice(0, 16)
        : "",
      assignedTo: u.assignedTo || "",
      status: (u.status as UpdateStatus) || "pending",
    });
    formDisc.onOpen();
  };

  /* ── save (create or update) ── */
  const handleSave = async () => {
    if (!form.title.trim()) {
      showError("El título es obligatorio");
      return;
    }
    if (form.title.trim().length < 3) {
      showError("El título debe tener al menos 3 caracteres");
      return;
    }

    setIsSaving(true);
    try {
      if (editingUpdate) {
        await updateReportUpdate(editingUpdate.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          status: form.status || "pending",
          dueDate: form.dueDate || undefined,
          assignedTo: form.assignedTo || undefined,
        });
        showSuccess("Actualización guardada");
      } else {
        await createReportUpdate(reportId, {
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          dueDate: form.dueDate || undefined,
          assignedTo: form.assignedTo || undefined,
        });
        showSuccess("Actualización creada");
      }
      formDisc.onClose();
      await loadUpdates();
    } catch (e: any) {
      showError(e?.message || "No se pudo guardar la actualización");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── quick status change ── */
  const handleStatusChange = async (id: number, status: UpdateStatus) => {
    const u = updates.find((x) => x.id === id);
    if (!u) return;
    setIsSaving(true);
    try {
      await updateReportUpdate(id, {
        title: u.title,
        description: u.description,
        priority: (u.priority as UpdatePriority) || "medium",
        status,
        dueDate: u.dueDate
          ? new Date(u.dueDate).toISOString().slice(0, 10)
          : undefined,
        assignedTo: u.assignedTo || undefined,
      });
      await loadUpdates();
    } catch (e: any) {
      showError(e?.message || "No se pudo cambiar el estado");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── delete ── */
  const handleDeleteOpen = (u: ReportUpdate) => {
    setDeleteTarget(u);
    deleteDisc.onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await deleteReportUpdate(deleteTarget.id);
      showSuccess("Actualización eliminada");
      deleteDisc.onClose();
      await loadUpdates();
    } catch (e: any) {
      showError(e?.message || "No se pudo eliminar la actualización");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── helpers ── */
  const setField = <K extends keyof UpdateForm>(k: K, v: UpdateForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  /* ── render ── */
  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Actualizaciones del caso
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Registro de hitos, avances y decisiones
            </p>
          </div>
          {!isReportClosed && (
            <Button
              size="sm"
              color="primary"
              onPress={openAdd}
              startContent={<i className="icon-[lucide--plus] size-3.5" />}
            >
              Nueva actualización
            </Button>
          )}
        </div>

        {/* Closed notice */}
        {isReportClosed && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <i className="icon-[lucide--lock] size-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              Caso cerrado. Las actualizaciones son de solo lectura.
            </p>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center">
            <i className="icon-[lucide--list-checks] size-10 text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-500">Sin actualizaciones</p>
            <p className="text-xs text-gray-400 mt-1">
              {isReportClosed
                ? "Este caso no tiene actualizaciones registradas."
                : "Agrega la primera actualización para documentar el avance."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => {
              const statusCfg = STATUS_CONFIG[(u.status as UpdateStatus) || "pending"];
              const priCfg = PRIORITY_CONFIG[(u.priority as UpdatePriority) || "medium"];
              const due = u.dueDate
                ? (typeof u.dueDate === "string" ? u.dueDate : (u.dueDate as Date).toISOString())
                : null;
              const overdue = due ? isOverdue(due) : false;
              const daysOverdue = due ? calculateDaysOverdue(due) : 0;

              return (
                <div
                  key={u.id}
                  className={`group bg-white rounded-xl border shadow-sm hover:shadow transition-shadow p-4 ${
                    u.status === "completed" ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon button */}
                    <div className="shrink-0 mt-0.5">
                      {!isReportClosed ? (
                        <Tooltip
                          content="Cambiar estado"
                          placement="left"
                        >
                          <button
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              const next: Record<UpdateStatus, UpdateStatus> = {
                                pending: "in_progress",
                                in_progress: "completed",
                                completed: "pending",
                              };
                              handleStatusChange(
                                u.id,
                                next[(u.status as UpdateStatus) || "pending"]
                              );
                            }}
                            disabled={isSaving}
                          >
                            <i
                              className={`${statusCfg.icon} size-5 ${
                                u.status === "completed"
                                  ? "text-green-500"
                                  : u.status === "in_progress"
                                    ? "text-yellow-500"
                                    : "text-gray-400"
                              }`}
                            />
                          </button>
                        </Tooltip>
                      ) : (
                        <i className={`${statusCfg.icon} size-5 text-gray-400 mt-1`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-sm font-semibold ${
                              u.status === "completed"
                                ? "line-through text-gray-400"
                                : "text-gray-900"
                            }`}
                          >
                            {u.title}
                          </h3>
                          {u.description && (
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {u.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        {!isReportClosed && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip content="Editar">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => openEdit(u)}
                              >
                                <i className="icon-[lucide--pencil] size-3.5" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => handleDeleteOpen(u)}
                              >
                                <i className="icon-[lucide--trash-2] size-3.5" />
                              </Button>
                            </Tooltip>
                          </div>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Chip size="sm" color={statusCfg.color} variant="flat">
                          {statusCfg.label}
                        </Chip>
                        <Chip size="sm" color={priCfg.color} variant="flat">
                          {priCfg.label}
                        </Chip>
                        {overdue && (
                          <Chip size="sm" color="danger" variant="flat">
                            <i className="icon-[lucide--alert-circle] size-3 mr-1" />
                            Vencida hace {daysOverdue}d
                          </Chip>
                        )}
                        {u.assignedTo && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <i className="icon-[lucide--user] size-3" />
                            {u.assignedTo}
                          </span>
                        )}
                        {due && !overdue && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <i className="icon-[lucide--calendar] size-3" />
                            Vence: {formatDate(due)}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDate(
                            typeof u.updatedAt === "string"
                              ? u.updatedAt
                              : (u.updatedAt as Date)?.toISOString() || ""
                          )}
                        </span>
                      </div>

                      {/* Quick status switcher (visible on hover) */}
                      {!isReportClosed && (
                        <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() =>
                                handleStatusChange(u.id, key as UpdateStatus)
                              }
                              disabled={isSaving || u.status === key}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                                u.status === key
                                  ? "bg-gray-100 border-gray-200 text-gray-500 cursor-default"
                                  : "border-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                              }`}
                            >
                              <i className={`${cfg.icon} size-3`} />
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit modal ── */}
      <Modal isOpen={formDisc.isOpen} onOpenChange={formDisc.onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <i
                  className={`${
                    editingUpdate
                      ? "icon-[lucide--pencil]"
                      : "icon-[lucide--plus-circle]"
                  } size-5 text-gray-500`}
                />
                {editingUpdate ? "Editar actualización" : "Nueva actualización"}
              </ModalHeader>
              <ModalBody className="space-y-3">
                <Input
                  label="Título *"
                  placeholder="Describe el avance o hito alcanzado"
                  value={form.title}
                  onValueChange={(v) => setField("title", v)}
                  isRequired
                />
                <Textarea
                  label="Descripción"
                  placeholder="Detalles adicionales, contexto, decisiones tomadas…"
                  value={form.description}
                  onValueChange={(v) => setField("description", v)}
                  minRows={3}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Prioridad"
                    selectedKeys={[form.priority]}
                    onSelectionChange={(k) =>
                      setField("priority", Array.from(k)[0] as UpdatePriority)
                    }
                  >
                    <SelectItem key="low">Baja</SelectItem>
                    <SelectItem key="medium">Media</SelectItem>
                    <SelectItem key="high">Alta</SelectItem>
                  </Select>

                  {editingUpdate && (
                    <Select
                      label="Estado"
                      selectedKeys={[form.status || "pending"]}
                      onSelectionChange={(k) =>
                        setField("status", Array.from(k)[0] as UpdateStatus)
                      }
                    >
                      <SelectItem key="pending">Pendiente</SelectItem>
                      <SelectItem key="in_progress">En progreso</SelectItem>
                      <SelectItem key="completed">Completada</SelectItem>
                    </Select>
                  )}

                  <Input
                    label="Asignado a"
                    placeholder="Nombre del responsable"
                    value={form.assignedTo}
                    onValueChange={(v) => setField("assignedTo", v)}
                  />

                  <Input
                    label="Fecha límite"
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(e) => setField("dueDate", e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} isDisabled={isSaving}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={isSaving}
                  startContent={
                    !isSaving && (
                      <i
                        className={`${
                          editingUpdate
                            ? "icon-[lucide--save]"
                            : "icon-[lucide--plus]"
                        } size-4`}
                      />
                    )
                  }
                >
                  {editingUpdate ? "Guardar cambios" : "Crear actualización"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── Delete confirmation modal ── */}
      <Modal isOpen={deleteDisc.isOpen} onOpenChange={deleteDisc.onOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2 text-red-700">
                <i className="icon-[lucide--trash-2] size-4" />
                Eliminar actualización
              </ModalHeader>
              <ModalBody>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-red-800">
                    {deleteTarget?.title}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" size="sm" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  isLoading={isSaving}
                  onPress={handleDeleteConfirm}
                  startContent={
                    !isSaving && <i className="icon-[lucide--trash-2] size-3.5" />
                  }
                >
                  Eliminar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
