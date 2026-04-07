/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReportUpdate } from "@/types/reports";
import {
  createReportTask,
  updateReportTask,
  deleteReportTask,
  getReportUpdates,
} from "@/actions/reports.actions";
import { motion, AnimatePresence } from "framer-motion";
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
  Progress,
  Divider,
} from "@heroui/react";
import { useOrganization } from "@/modules/app/hooks/useOrganization";
import { MemberPicker, OrgMember } from "./MemberPicker";

interface ReportTasksProps {
  reportId: number;
}

type TaskStatus = "pending" | "in_progress" | "blocked" | "completed";
type TaskPriority = "low" | "medium" | "high";

type UiTask = ReportUpdate & {
  children?: UiTask[];
  completionNotes?: string | null;
  completedAt?: Date | string | null;
};

/* ── visual config ── */
const STATUS_CFG: Record<
  TaskStatus,
  {
    label: string;
    icon: string;
    bg: string;
    text: string;
    ring: string;
    chipColor: "default" | "warning" | "danger" | "success";
  }
> = {
  pending: {
    label: "Pendiente",
    icon: "icon-[lucide--circle]",
    bg: "bg-gray-100",
    text: "text-gray-500",
    ring: "ring-gray-300",
    chipColor: "default",
  },
  in_progress: {
    label: "En progreso",
    icon: "icon-[lucide--circle-dot]",
    bg: "bg-amber-50",
    text: "text-amber-500",
    ring: "ring-amber-300",
    chipColor: "warning",
  },
  blocked: {
    label: "Bloqueada",
    icon: "icon-[lucide--circle-x]",
    bg: "bg-red-50",
    text: "text-red-500",
    ring: "ring-red-300",
    chipColor: "danger",
  },
  completed: {
    label: "Completada",
    icon: "icon-[lucide--circle-check]",
    bg: "bg-green-50",
    text: "text-green-500",
    ring: "ring-green-300",
    chipColor: "success",
  },
};

const PRIORITY_CFG: Record<
  TaskPriority,
  { label: string; icon: string; chipColor: "default" | "warning" | "danger"; dot: string }
> = {
  low: { label: "Baja", icon: "icon-[lucide--arrow-down]", chipColor: "default", dot: "bg-gray-400" },
  medium: { label: "Media", icon: "icon-[lucide--arrow-right]", chipColor: "warning", dot: "bg-amber-400" },
  high: { label: "Alta", icon: "icon-[lucide--arrow-up]", chipColor: "danger", dot: "bg-red-400" },
};

/* ════════════════════════════════════════════════
   Task Form Modal (create / edit)
════════════════════════════════════════════════ */
function TaskFormModal({
  isOpen,
  onOpenChange,
  onSave,
  members,
  membersLoading,
  isSaving,
  editingTask,
  parentTask,
}: {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (values: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo: string;
    dueDate: string;
  }) => Promise<void>;
  members: OrgMember[];
  membersLoading: boolean;
  isSaving: boolean;
  editingTask?: UiTask | null;
  parentTask?: UiTask | null;
}) {
  const isEdit = !!editingTask;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  /* assignedTo stores the display NAME, not the userId */
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitleError("");
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setPriority((editingTask.priority as TaskPriority) || "medium");
      setStatus((editingTask.status as TaskStatus) || "pending");
      setAssignedTo(editingTask.assignedTo || "");
      setDueDate(
        editingTask.dueDate
          ? new Date(editingTask.dueDate).toISOString().slice(0, 10)
          : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setStatus("pending");
      setAssignedTo("");
      setDueDate("");
    }
  }, [isOpen, editingTask]);

  const handleSave = async () => {
    const t = title.trim();
    if (!t) { setTitleError("El título es obligatorio"); return; }
    if (t.length < 3) { setTitleError("Mínimo 3 caracteres"); return; }
    setTitleError("");
    await onSave({ title: t, description: description.trim(), priority, status, assignedTo, dueDate });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2.5 pb-2">
              <div className={`p-1.5 rounded-lg ${isEdit ? "bg-blue-100" : parentTask ? "bg-violet-100" : "bg-blue-100"}`}>
                <i
                  className={`size-4 ${
                    isEdit
                      ? "icon-[lucide--pencil] text-blue-700"
                      : parentTask
                        ? "icon-[lucide--git-branch] text-violet-700"
                        : "icon-[lucide--plus] text-blue-700"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isEdit
                    ? "Editar tarea"
                    : parentTask
                      ? `Subtarea de "${parentTask.title}"`
                      : "Nueva tarea de investigación"}
                </p>
                <p className="text-xs text-gray-400 font-normal">
                  {isEdit
                    ? "Modifica los campos que necesites"
                    : parentTask
                      ? "Crea una subtarea para desglosar esta tarea"
                      : "Completa la información de la tarea"}
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="gap-4">
              {/* Title */}
              <Input
                label="Título de la tarea"
                placeholder="¿Qué hay que hacer?"
                value={title}
                onValueChange={(v) => { setTitle(v); if (v.trim().length >= 3) setTitleError(""); }}
                isInvalid={!!titleError}
                errorMessage={titleError}
                isRequired
                startContent={<i className="icon-[lucide--clipboard-list] size-4 text-gray-400 shrink-0" />}
              />

              {/* Description */}
              <Textarea
                label="Objetivo y descripción"
                placeholder="Describe el objetivo, qué se debe investigar, revisar o ejecutar…"
                value={description}
                onValueChange={setDescription}
                minRows={3}
                maxRows={6}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Priority */}
                <Select
                  label="Prioridad"
                  selectedKeys={[priority]}
                  onSelectionChange={(k) => setPriority(Array.from(k)[0] as TaskPriority)}
                  startContent={
                    <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_CFG[priority]?.dot}`} />
                  }
                >
                  {Object.entries(PRIORITY_CFG).map(([key, cfg]) => (
                    <SelectItem key={key} startContent={<i className={`${cfg.icon} size-3.5`} />}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </Select>

                {/* Due date */}
                <Input
                  label="Fecha límite"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  startContent={<i className="icon-[lucide--calendar] size-4 text-gray-400 shrink-0" />}
                />

                {/* Status — only on edit */}
                {isEdit && (
                  <Select
                    label="Estado"
                    selectedKeys={[status]}
                    onSelectionChange={(k) => setStatus(Array.from(k)[0] as TaskStatus)}
                    startContent={
                      <i className={`${STATUS_CFG[status]?.icon} size-3.5 ${STATUS_CFG[status]?.text} shrink-0`} />
                    }
                  >
                    {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                      <SelectItem key={key} startContent={<i className={`${cfg.icon} size-3.5 ${cfg.text}`} />}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </Select>
                )}

                {/* Assignee — MemberPicker */}
                <div className={isEdit ? "" : "sm:col-span-2"}>
                  <MemberPicker
                    label="Responsable"
                    value={assignedTo}
                    onChange={setAssignedTo}
                    members={members}
                    isLoading={membersLoading}
                    placeholder="Sin asignar"
                  />
                </div>
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
                startContent={!isSaving && <i className={`${isEdit ? "icon-[lucide--save]" : "icon-[lucide--plus]"} size-4`} />}
              >
                {isEdit ? "Guardar cambios" : "Crear tarea"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   Complete Task Modal (conclusions)
════════════════════════════════════════════════ */
function CompleteTaskModal({
  isOpen,
  onOpenChange,
  task,
  onConfirm,
  isSaving,
}: {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  task: UiTask | null;
  onConfirm: (notes: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [notes, setNotes] = useState("");
  useEffect(() => { if (isOpen) setNotes(""); }, [isOpen]);

  const pendingSubtasks =
    task?.children?.filter((c) => c.status !== "completed").length ?? 0;
  const totalSubtasks = task?.children?.length ?? 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2.5">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <i className="icon-[lucide--circle-check] size-4 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Cerrar tarea</p>
                <p className="text-xs text-gray-400 font-normal">
                  Documenta los hallazgos antes de cerrar
                </p>
              </div>
            </ModalHeader>

            <ModalBody className="gap-4">
              {/* Task card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Tarea a cerrar</p>
                <p className="text-sm font-semibold text-gray-900">{task?.title}</p>
                {task?.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                )}
              </div>

              {/* Pending subtasks warning */}
              {pendingSubtasks > 0 && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <i className="icon-[lucide--triangle-alert] size-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      {pendingSubtasks} subtarea{pendingSubtasks !== 1 ? "s" : ""} sin completar
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {totalSubtasks - pendingSubtasks}/{totalSubtasks} completadas. Al cerrar la tarea principal estas quedarán pendientes.
                    </p>
                  </div>
                </div>
              )}

              {/* Conclusions */}
              <Textarea
                label="Conclusiones y notas de cierre"
                placeholder="¿Qué se encontró? ¿Qué acciones se tomaron? ¿Cuáles fueron los resultados? ¿Hay algo pendiente de seguimiento?"
                value={notes}
                onValueChange={setNotes}
                minRows={4}
                maxRows={8}
                description="Documenta hallazgos, acciones y resultados. Quedará registrado en la tarea."
              />
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isSaving}>
                Cancelar
              </Button>
              <Button
                color="success"
                className="text-white"
                onPress={() => onConfirm(notes)}
                isLoading={isSaving}
                startContent={!isSaving && <i className="icon-[lucide--circle-check] size-4" />}
              >
                Cerrar tarea
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   Delete Modal
════════════════════════════════════════════════ */
function DeleteModal({
  isOpen,
  onOpenChange,
  task,
  onConfirm,
  isSaving,
}: {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  task: UiTask | null;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
}) {
  const childCount = task?.children?.length ?? 0;
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 text-red-700 text-sm">
              <i className="icon-[lucide--trash-2] size-4" />
              Eliminar tarea
            </ModalHeader>
            <ModalBody className="gap-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-red-800">{task?.title}</p>
                {childCount > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Incluye {childCount} subtarea{childCount !== 1 ? "s" : ""} que también se eliminarán.
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" size="sm" onPress={onClose}>Cancelar</Button>
              <Button
                color="danger" size="sm"
                isLoading={isSaving}
                onPress={onConfirm}
                startContent={!isSaving && <i className="icon-[lucide--trash-2] size-3.5" />}
              >
                Eliminar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   Task Card
════════════════════════════════════════════════ */
function TaskCard({
  task,
  depth,
  isSaving,
  members,
  membersLoading,
  onComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  onInlineUpdate,
}: {
  task: UiTask;
  depth: number;
  isSaving: boolean;
  members: OrgMember[];
  membersLoading: boolean;
  onComplete: (t: UiTask) => void;
  onEdit: (t: UiTask) => void;
  onDelete: (t: UiTask) => void;
  onAddSubtask: (t: UiTask) => void;
  onInlineUpdate: (id: number, data: Parameters<typeof updateReportTask>[1]) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const status = (task.status as TaskStatus) || "pending";
  const priority = (task.priority as TaskPriority) || "medium";
  const sCfg = STATUS_CFG[status];
  const pCfg = PRIORITY_CFG[priority];

  const hasChildren = (task.children || []).length > 0;
  const completedChildren = (task.children || []).filter((c) => c.status === "completed").length;
  const totalChildren = (task.children || []).length;
  const subtaskPct = totalChildren > 0 ? (completedChildren / totalChildren) * 100 : 0;

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const now = new Date();
  const isOverdue = dueDateObj && status !== "completed" && dueDateObj < now;
  const isDueSoon =
    dueDateObj &&
    status !== "completed" &&
    !isOverdue &&
    dueDateObj.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  const nextStatus = () => {
    if (status === "completed") { onInlineUpdate(task.id, { status: "pending" }); return; }
    if (status === "pending") { onInlineUpdate(task.id, { status: "in_progress" }); return; }
    if (status === "in_progress") { onComplete(task); return; }
    if (status === "blocked") { onInlineUpdate(task.id, { status: "in_progress" }); return; }
  };

  const cycleTooltip =
    status === "completed"
      ? "Reabrir tarea"
      : status === "pending"
        ? "Iniciar — marcar en progreso"
        : status === "in_progress"
          ? "Completar tarea"
          : "Desbloquear — volver a en progreso";

  return (
    <motion.div layout transition={{ duration: 0.15 }}>
      <div
        className={`group rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
          status === "completed" ? "border-green-200 bg-green-50/20" : "border-gray-200"
        } ${depth > 0 ? "border-l-4 border-l-blue-200" : ""}`}
      >
        {/* Main row */}
        <div className="flex items-start gap-3 p-3.5">
          {/* Status cycle button */}
          <Tooltip content={cycleTooltip} placement="top">
            <button
              onClick={nextStatus}
              disabled={isSaving}
              className={`shrink-0 mt-0.5 p-1 rounded-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${sCfg.bg} ring-1 ${sCfg.ring}`}
            >
              <i className={`${sCfg.icon} size-5 ${sCfg.text}`} />
            </button>
          </Tooltip>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {/* Title row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    #{task.id}
                  </span>
                  <span
                    className={`text-sm font-semibold leading-snug ${
                      status === "completed" ? "line-through text-gray-400" : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Meta chips */}
                <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                  <Chip size="sm" variant="flat" color={sCfg.chipColor}>
                    <i className={`${sCfg.icon} size-3 mr-1`} />
                    {sCfg.label}
                  </Chip>
                  <Chip size="sm" variant="flat" color={pCfg.chipColor}>
                    <i className={`${pCfg.icon} size-3 mr-1`} />
                    {pCfg.label}
                  </Chip>

                  {task.assignedTo && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                      <i className="icon-[lucide--user] size-3" />
                      {task.assignedTo}
                    </span>
                  )}

                  {dueDateObj && (
                    <span
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? "bg-red-100 text-red-700 font-semibold"
                          : isDueSoon
                            ? "bg-amber-100 text-amber-700"
                            : "text-gray-500"
                      }`}
                    >
                      <i className={`size-3 ${isOverdue ? "icon-[lucide--alert-circle]" : "icon-[lucide--calendar]"}`} />
                      {isOverdue ? "Vencida: " : "Vence: "}
                      {fmtDate(dueDateObj)}
                    </span>
                  )}
                </div>

                {/* Subtask progress */}
                {hasChildren && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">
                        Subtareas: {completedChildren}/{totalChildren}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {Math.round(subtaskPct)}%
                      </span>
                    </div>
                    <Progress
                      value={subtaskPct}
                      size="sm"
                      color={subtaskPct === 100 ? "success" : "primary"}
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>

              {/* Action buttons (visible on hover) */}
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {hasChildren && (
                  <Tooltip content={expanded ? "Contraer subtareas" : "Expandir subtareas"}>
                    <Button isIconOnly size="sm" variant="light" onPress={() => setExpanded((v) => !v)}>
                      <i className={`${expanded ? "icon-[lucide--chevron-up]" : "icon-[lucide--chevron-down]"} size-3.5`} />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content={showDetails ? "Ocultar detalles" : "Ver detalles"}>
                  <Button isIconOnly size="sm" variant="light" onPress={() => setShowDetails((v) => !v)}>
                    <i className={`${showDetails ? "icon-[lucide--eye-off]" : "icon-[lucide--eye]"} size-3.5`} />
                  </Button>
                </Tooltip>
                {status !== "completed" && (
                  <Tooltip content="Agregar subtarea">
                    <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => onAddSubtask(task)}>
                      <i className="icon-[lucide--git-branch] size-3.5" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Editar">
                  <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(task)}>
                    <i className="icon-[lucide--pencil] size-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip content="Eliminar">
                  <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDelete(task)}>
                    <i className="icon-[lucide--trash-2] size-3.5" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence initial={false}>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <Divider />
              <div className="px-4 py-3 space-y-3 bg-gray-50/50 rounded-b-xl">
                {task.description && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Objetivo / Descripción
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
                  </div>
                )}

                {task.completionNotes && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <i className="icon-[lucide--file-check] size-3.5" />
                      Conclusiones de cierre
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.completionNotes}</p>
                    {task.completedAt && (
                      <p className="text-[11px] text-green-500 mt-1.5">
                        Cerrada el{" "}
                        {new Date(task.completedAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                )}

                {!task.description && !task.completionNotes && (
                  <p className="text-xs text-gray-400 italic">Sin descripción ni notas registradas.</p>
                )}

                {/* Metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <MetaCell label="Creado por" value={task.createdByName} />
                  <MetaCell
                    label="Fecha creación"
                    value={
                      task.createdAt
                        ? new Date(task.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
                        : null
                    }
                  />
                  <MetaCell label="Responsable" value={task.assignedTo} />
                  <MetaCell
                    label="Última actualización"
                    value={
                      task.updatedAt
                        ? new Date(task.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                        : null
                    }
                  />
                </div>

                {/* Inline re-assign from detail panel */}
                <div className="pt-1">
                  <MemberPicker
                    label="Cambiar responsable"
                    size="sm"
                    value={task.assignedTo || ""}
                    onChange={(name) => onInlineUpdate(task.id, { assignedTo: name || null })}
                    members={members}
                    isLoading={membersLoading}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-6 pl-4 border-l-2 border-blue-100 space-y-2">
              {task.children!.map((child) => (
                <TaskCard
                  key={child.id}
                  task={child}
                  depth={depth + 1}
                  isSaving={isSaving}
                  members={members}
                  membersLoading={membersLoading}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubtask={onAddSubtask}
                  onInlineUpdate={onInlineUpdate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MetaCell({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-gray-700 mt-0.5">{value || "—"}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   Stats bar
════════════════════════════════════════════════ */
function StatsBar({ tasks }: { tasks: UiTask[] }) {
  const all = (function flat(list: UiTask[]): UiTask[] {
    return list.flatMap((t) => [t, ...(t.children ? flat(t.children) : [])]);
  })(tasks);

  const counts = all.reduce<Record<string, number>>(
    (acc, t) => { acc[t.status || "pending"] = (acc[t.status || "pending"] || 0) + 1; return acc; },
    {}
  );

  const total = all.length;
  const done = counts.completed || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = [
    { key: "pending", label: "Pendientes", cls: "bg-gray-200 text-gray-700" },
    { key: "in_progress", label: "En progreso", cls: "bg-amber-100 text-amber-800" },
    { key: "blocked", label: "Bloqueadas", cls: "bg-red-100 text-red-700" },
    { key: "completed", label: "Completadas", cls: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {stats.map((s) =>
          counts[s.key] ? (
            <span key={s.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
              {counts[s.key]} <span className="opacity-70">{s.label}</span>
            </span>
          ) : null
        )}
        {total > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {done}/{total} completadas · {pct}%
          </span>
        )}
      </div>
      {total > 0 && (
        <Progress value={pct} size="sm" color={pct === 100 ? "success" : "primary"} aria-label="Progreso general" />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   Main Component
════════════════════════════════════════════════ */
export const ReportTasks: React.FC<ReportTasksProps> = ({ reportId }) => {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(false);

  const { showSuccess, showError } = useSafeToast();
  const { currentOrganization } = useOrganization();

  /* modals */
  const formDisc = useDisclosure();
  const completeDisc = useDisclosure();
  const deleteDisc = useDisclosure();

  const [editingTask, setEditingTask] = useState<UiTask | null>(null);
  const [parentForSubtask, setParentForSubtask] = useState<UiTask | null>(null);
  const [completeTarget, setCompleteTarget] = useState<UiTask | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UiTask | null>(null);

  /* ── load members — retries when org changes ── */
  const loadMembersRef = useRef<string | null>(null);
  const loadMembers = useCallback(async (orgId: string) => {
    if (loadMembersRef.current === orgId) return; // already loading for this org
    loadMembersRef.current = orgId;
    setMembersLoading(true);
    setMembersError(false);
    try {
      const res = await fetch(`/api/organization/${orgId}/members`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: OrgMember[] = (data.members || [])
        .filter((m: any) => !m.isBlocked)
        .map((m: any) => ({
          userId: m.userId,
          userName: [m.user.firstName, m.user.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || m.user.email,
          role: m.role as "ADMIN" | "MEMBER",
          department: m.department || null,
          isBlocked: m.isBlocked || false,
        }));
      setMembers(mapped);
    } catch {
      setMembersError(true);
      loadMembersRef.current = null; // allow retry
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadMembersRef.current = null; // reset cache when org changes
      loadMembers(currentOrganization.id);
    }
  }, [currentOrganization?.id, loadMembers]);

  /* ── load tasks ── */
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const flat = await getReportUpdates(reportId);
      const byId: Record<number, UiTask> = {};
      flat.forEach((t: any) => (byId[t.id] = { ...t, children: [] }));
      const roots: UiTask[] = [];
      flat.forEach((t: any) => {
        if (t.parentId) byId[t.parentId]?.children?.push(byId[t.id]);
        else roots.push(byId[t.id]);
      });
      setTasks(roots);
    } catch {
      showError("No se pudieron cargar las tareas");
    } finally {
      setIsLoading(false);
    }
  }, [reportId, showError]);

  useEffect(() => { load(); }, [load]);

  /* ── inline update ── */
  const handleInlineUpdate = useCallback(
    async (id: number, data: Parameters<typeof updateReportTask>[1]) => {
      setIsSaving(true);
      try {
        await updateReportTask(id, data);
        await load();
      } catch (e: any) {
        showError(e?.message || "No se pudo actualizar la tarea");
      } finally {
        setIsSaving(false);
      }
    },
    [load, showError]
  );

  /* ── open modals ── */
  const openCreate = () => { setEditingTask(null); setParentForSubtask(null); formDisc.onOpen(); };
  const openAddSubtask = (p: UiTask) => { setEditingTask(null); setParentForSubtask(p); formDisc.onOpen(); };
  const openEdit = (t: UiTask) => { setEditingTask(t); setParentForSubtask(null); formDisc.onOpen(); };
  const openComplete = (t: UiTask) => { setCompleteTarget(t); completeDisc.onOpen(); };
  const openDelete = (t: UiTask) => { setDeleteTarget(t); deleteDisc.onOpen(); };

  /* ── save task ── */
  const handleSaveTask = async (values: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo: string;
    dueDate: string;
  }) => {
    setIsSaving(true);
    try {
      if (editingTask) {
        await updateReportTask(editingTask.id, {
          title: values.title,
          description: values.description,
          priority: values.priority,
          status: values.status,
          /* assignedTo stores display name */
          assignedTo: values.assignedTo || null,
          dueDate: values.dueDate || null,
        });
        showSuccess("Tarea actualizada");
      } else {
        await createReportTask(reportId, {
          title: values.title,
          description: values.description,
          priority: values.priority,
          status: values.status,
          assignedTo: values.assignedTo || undefined,
          dueDate: values.dueDate || undefined,
          parentId: parentForSubtask?.id,
        });
        showSuccess(parentForSubtask ? "Subtarea creada" : "Tarea creada");
      }
      formDisc.onClose();
      await load();
    } catch (e: any) {
      showError(e?.message || "No se pudo guardar la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── complete ── */
  const handleComplete = async (notes: string) => {
    if (!completeTarget) return;
    setIsSaving(true);
    try {
      await updateReportTask(completeTarget.id, {
        status: "completed",
        completionNotes: notes || null,
      });
      showSuccess("Tarea marcada como completada");
      completeDisc.onClose();
      await load();
    } catch (e: any) {
      showError(e?.message || "No se pudo completar la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await deleteReportTask(deleteTarget.id);
      showSuccess("Tarea eliminada");
      deleteDisc.onClose();
      await load();
    } catch (e: any) {
      showError(e?.message || "No se pudo eliminar la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── render ── */
  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <i className="icon-[lucide--check-square] size-4 text-blue-600" />
              Tareas de investigación
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Organiza, asigna y da seguimiento a cada acción del caso
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Members error / retry */}
            {membersError && (
              <Tooltip content="Error al cargar el equipo. Haz clic para reintentar.">
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  isIconOnly
                  onPress={() => currentOrganization?.id && (() => { loadMembersRef.current = null; loadMembers(currentOrganization.id); })()}
                >
                  <i className="icon-[lucide--refresh-cw] size-3.5" />
                </Button>
              </Tooltip>
            )}
            <Button
              color="primary"
              size="sm"
              onPress={openCreate}
              startContent={<i className="icon-[lucide--plus] size-3.5" />}
            >
              Nueva tarea
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && tasks.length > 0 && <StatsBar tasks={tasks} />}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-center">
            <div className="p-4 bg-blue-50 rounded-2xl mb-4">
              <i className="icon-[lucide--clipboard-list] size-10 text-blue-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Sin tareas asignadas</p>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xs">
              Crea la primera tarea para organizar y dar seguimiento a las acciones de investigación.
            </p>
            <Button
              className="mt-5"
              color="primary"
              size="sm"
              onPress={openCreate}
              startContent={<i className="icon-[lucide--plus] size-3.5" />}
            >
              Crear primera tarea
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                depth={0}
                isSaving={isSaving}
                members={members}
                membersLoading={membersLoading}
                onComplete={openComplete}
                onEdit={openEdit}
                onDelete={openDelete}
                onAddSubtask={openAddSubtask}
                onInlineUpdate={handleInlineUpdate}
              />
            ))}
          </div>
        )}
      </div>

      <TaskFormModal
        isOpen={formDisc.isOpen}
        onOpenChange={formDisc.onOpenChange}
        onSave={handleSaveTask}
        members={members}
        membersLoading={membersLoading}
        isSaving={isSaving}
        editingTask={editingTask}
        parentTask={parentForSubtask}
      />

      <CompleteTaskModal
        isOpen={completeDisc.isOpen}
        onOpenChange={completeDisc.onOpenChange}
        task={completeTarget}
        onConfirm={handleComplete}
        isSaving={isSaving}
      />

      <DeleteModal
        isOpen={deleteDisc.isOpen}
        onOpenChange={deleteDisc.onOpenChange}
        task={deleteTarget}
        onConfirm={handleDelete}
        isSaving={isSaving}
      />
    </>
  );
};
