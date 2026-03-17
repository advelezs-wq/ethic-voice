"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ReportUpdate } from "@/types/reports";
import {
  createReportTask,
  updateReportTask,
  deleteReportTask,
  getReportUpdates,
} from "@/actions/reports.actions";
import { motion, AnimatePresence } from "framer-motion";
import { useSafeToast } from "../../hooks/useSafeToast";
import { useForm, Controller } from "react-hook-form";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  DatePicker,
  Button,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useOrganization } from "@/modules/app/hooks/useOrganization";

interface ReportTasksProps {
  reportId: number;
}

type UiTask = ReportUpdate & { children?: UiTask[] };

// Normalize to CalendarDate expected by HeroUI DatePicker
function toCalendarDate(input: unknown): any | null {
  try {
    if (!input) return null;
    if (typeof input === "string") {
      const iso = input.includes("T") ? input.split("T")[0] : input;
      return parseDate(iso) as any;
    }
    // If JS Date
    if (input instanceof Date) {
      const iso = input.toISOString().split("T")[0];
      return parseDate(iso) as any;
    }
    // If already DateValue-like (CalendarDate/CalendarDateTime)
    if (
      typeof input === "object" &&
      input !== null &&
      "toString" in (input as any)
    ) {
      return input as any;
    }
  } catch {
    return null;
  }
  return null;
}

export const ReportTasks: React.FC<ReportTasksProps> = ({ reportId }) => {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // New task form (root) - react-hook-form
  const [showNewForm, setShowNewForm] = useState(false);
  type TaskFormValues = {
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "in_progress" | "completed" | "blocked";
    assignedTo?: string;
    dueDate?: string | null;
  };
  const {
    control,
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting: isSubmittingRoot },
    reset: resetRoot,
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      assignedTo: "",
      dueDate: undefined,
    },
  });

  // Subtask form (per parent)
  const [openSubFormParentId, setOpenSubFormParentId] = useState<number | null>(
    null
  );
  const {
    control: subControl,
    register: subRegister,
    handleSubmit: handleSubmitSub,
    formState: { errors: subErrors, isSubmitting: isSubmittingSub },
    reset: resetSub,
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      assignedTo: "",
      dueDate: undefined,
    },
  });

  const { showSuccess, showError } = useSafeToast();
  const { currentOrganization } = useOrganization();
  type MemberItem = {
    userId: string;
    userName: string;
    role: "ADMIN" | "MEMBER";
    department?: string | null;
  };
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberItem[]>([]);
  const [loadingInvestigators, setLoadingInvestigators] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");

  const loadMembers = useCallback(
    async () => {
      try {
        setLoadingInvestigators(true);
        const res = await fetch(`/api/organization/${currentOrganization?.id}/members`);
        if (res.ok) {
          const data = await res.json();
          const mapped: MemberItem[] = (data.members || []).map((m: any) => ({
            userId: m.userId,
            userName: `${m.user.firstName || ""} ${m.user.lastName || m.user.email}`.trim(),
            role: m.role,
            department: m.department || null,
          }));
          setMembers(mapped);
          setFilteredMembers(mapped);
        }
      } finally {
        setLoadingInvestigators(false);
      }
    },
    [currentOrganization?.id]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const flat = await getReportUpdates(reportId);
      // Build tree by parentId
      const byId: Record<number, UiTask> = {};
      flat.forEach((t) => (byId[t.id] = { ...t, children: [] }));
      const roots: UiTask[] = [];
      flat.forEach((t) => {
        if (t.parentId) {
          byId[t.parentId]?.children?.push(byId[t.id]);
        } else {
          roots.push(byId[t.id]);
        }
      });
      setTasks(roots);
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
    // Preload members for selection
    loadMembers();
  }, [load, loadMembers]);

  // Filter members by query (name or department)
  useEffect(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) {
      setFilteredMembers(members);
    } else {
      setFilteredMembers(
        members.filter(
          (m) =>
            m.userName.toLowerCase().includes(q) ||
            (m.department || "").toLowerCase().includes(q)
        )
      );
    }
  }, [memberQuery, members]);

  const toggle = (id: number) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Helpers to update tree optimistically
  const pushRootOptimistic = (task: UiTask) =>
    setTasks((prev) => [...prev, task]);
  const pushChildOptimistic = (parentId: number, task: UiTask) =>
    setTasks((prev) =>
      prev.map((t) =>
        t.id === parentId
          ? { ...t, children: [...(t.children || []), task] }
          : t
      )
    );

  const onSubmitRoot = async (values: TaskFormValues) => {
    setIsSaving(true);
    try {
      const created = await createReportTask(reportId, {
        title: values.title.trim(),
        description: (values.description || "").trim(),
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || undefined,
        assignedTo: values.assignedTo || undefined,
      });
      pushRootOptimistic({ ...(created as unknown as UiTask), children: [] });
      setShowNewForm(false);
      resetRoot();
      showSuccess("Tarea creada");
      await load();
    } catch (e) {
      showError("No se pudo crear la tarea");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitSub = async (parentId: number, values: TaskFormValues) => {
    setIsSaving(true);
    try {
      const created = await createReportTask(reportId, {
        title: values.title.trim(),
        description: (values.description || "").trim(),
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || undefined,
        assignedTo: values.assignedTo || undefined,
        parentId,
      });
      pushChildOptimistic(parentId, {
        ...(created as unknown as UiTask),
        children: [],
      });
      setOpenSubFormParentId(null);
      resetSub();
      showSuccess("Subtarea creada");
      await load();
    } catch (e) {
      showError("No se pudo crear la subtarea");
    } finally {
      setIsSaving(false);
    }
  };

  // Simple wrapper (DnD removed)
  const SortableItem: React.FC<
    {
      item: UiTask;
      parentId: number | null;
      children?: React.ReactNode;
    } & React.HTMLAttributes<HTMLDivElement>
  > = ({ children }) => {
    return <motion.div layout>{children}</motion.div>;
  };

  // Dropzones removed (DnD disabled)
  const RootDropzone: React.FC = () => null;
  const RootBottomDropzone: React.FC = () => null;
  const ChildDropzone: React.FC<{ parentId: number }> = () => null;

  // Counters header
  const allTasks = (function flatten(list: UiTask[]): UiTask[] {
    return list.flatMap((t) => [t, ...(t.children ? flatten(t.children) : [])]);
  })(tasks);
  const statusCounts = allTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status || "pending"] = (acc[t.status || "pending"] || 0) + 1;
    return acc;
  }, {});
  const priorityCounts = allTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.priority || "medium"] = (acc[t.priority || "medium"] || 0) + 1;
    return acc;
  }, {});

  const renderNode = (task: UiTask, depth = 0) => {
    const hasChildren = (task.children || []).length > 0;
    const open = expanded[task.id] ?? true;
    const statusChip = (s: string) => {
      const map: Record<string, string> = {
        pending: "bg-gray-100 text-gray-700",
        in_progress: "bg-yellow-100 text-yellow-800",
        blocked: "bg-rose-100 text-rose-800",
        completed: "bg-green-100 text-green-800",
      };
      const label: Record<string, string> = {
        pending: "Pendiente",
        in_progress: "En progreso",
        blocked: "Bloqueada",
        completed: "Completada",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs ${map[s] || "bg-gray-100 text-gray-700"}`}
        >
          {label[s] || s}
        </span>
      );
    };
    const priorityChip = (p: string) => {
      const map: Record<string, string> = {
        low: "bg-slate-100 text-slate-800",
        medium: "bg-orange-100 text-orange-800",
        high: "bg-blue-100 text-blue-800",
      };
      const label: Record<string, string> = {
        low: "Baja",
        medium: "Media",
        high: "Alta",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs ${map[p] || "bg-slate-100 text-slate-800"}`}
        >
          {label[p] || p}
        </span>
      );
    };
    return (
      <SortableItem key={task.id} item={task} parentId={task.parentId ?? null}>
        <div className="border rounded-md p-3 mb-2 bg-white">
          <div className="flex flex-wrap items-center gap-3">
            {hasChildren ? (
              <button
                aria-label="Expandir"
                className="text-gray-600"
                onClick={() => toggle(task.id)}
              >
                {open ? "▾" : "▸"}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <a
              href={`?tab=tasks&task=${task.id}`}
              className="text-sm text-gray-500"
            >
              #t{task.id}
            </a>
            <div className="font-medium flex-1 min-w-[200px]">
              {task.title || (
                <span className="text-gray-400">(Sin título)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {priorityChip(task.priority)}
              {statusChip(task.status)}
            </div>
            <Select
              aria-label="Asignar a investigador"
              className="max-w-[240px]"
              selectedKeys={task.assignedTo ? [task.assignedTo] : []}
              placeholder={
                loadingInvestigators ? "Cargando..." : "Asignar a..."
              }
              onOpenChange={(open) => {
                if (open && members.length === 0) loadMembers();
              }}
              onSelectionChange={async (keys) => {
                const selected = Array.from(keys)[0] as string | undefined;
                if (selected !== (task.assignedTo || undefined)) {
                  setIsSaving(true);
                  await updateReportTask(task.id, {
                    assignedTo: selected || null,
                  });
                  await load();
                  setIsSaving(false);
                }
              }}
            >
              <SelectItem
                key="__search"
                isDisabled
                className="sticky top-0 z-10 !opacity-100 !bg-white !cursor-default"
              >
                <div className="px-2 py-1">
                  <Input
                    size="sm"
                    placeholder="Buscar por nombre o departamento"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                  />
                </div>
              </SelectItem>
              {filteredMembers.length === 0 ? (
                <SelectItem key="none" isDisabled>
                  {loadingInvestigators
                    ? "Cargando..."
                    : members.length === 0
                      ? "No hay miembros en la organización"
                      : "Sin coincidencias"}
                </SelectItem>
              ) : (
                <>
                  {/* Admins */}
                  {filteredMembers.some((m) => m.role === "ADMIN") && (
                    <SelectItem key="__admins" isDisabled className="opacity-70">
                      Administradores
                    </SelectItem>
                  )}
                  {filteredMembers
                    .filter((m) => m.role === "ADMIN")
                    .map((m) => (
                      <SelectItem key={m.userId} textValue={m.userName}>
                        <div className="flex flex-col">
                          <span className="text-sm">{m.userName}</span>
                          {m.department && (
                            <span className="text-xs text-gray-500">{m.department}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  {/* Investigators (members) */}
                  {filteredMembers.some((m) => m.role === "MEMBER") && (
                    <SelectItem key="__members" isDisabled className="opacity-70">
                      Investigadores
                    </SelectItem>
                  )}
                  {filteredMembers
                    .filter((m) => m.role === "MEMBER")
                    .map((m) => (
                      <SelectItem key={m.userId} textValue={m.userName}>
                        <div className="flex flex-col">
                          <span className="text-sm">{m.userName}</span>
                          {m.department && (
                            <span className="text-xs text-gray-500">{m.department}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </>
              )}
            </Select>
            <DatePicker
              aria-label="Fecha límite"
              value={toCalendarDate(task.dueDate)}
              onChange={async (date) => {
                const val = date ? date.toString() : null;
                setIsSaving(true);
                await updateReportTask(task.id, { dueDate: val });
                await load();
                setIsSaving(false);
              }}
              className="max-w-[180px]"
            />
            <Select
              aria-label="Estado de la tarea"
              selectedKeys={[task.status]}
              onSelectionChange={(keys) =>
                handleStatus(task, Array.from(keys)[0] as string)
              }
              className="max-w-[180px]"
            >
              <SelectItem key="pending">Pendiente</SelectItem>
              <SelectItem key="in_progress">En progreso</SelectItem>
              <SelectItem key="blocked">Bloqueada</SelectItem>
              <SelectItem key="completed">Completada</SelectItem>
            </Select>
            <button
              className="text-gray-700 underline text-sm"
              onClick={() =>
                setOpenSubFormParentId(
                  openSubFormParentId === task.id ? null : task.id
                )
              }
            >
              {openSubFormParentId === task.id
                ? "Cancelar subtarea"
                : "+ Subtarea"}
            </button>
            <button
              className="text-blue-700 underline text-sm"
              onClick={() => handleRename(task)}
            >
              Renombrar
            </button>
            <button
              className="text-red-600 underline text-sm"
              onClick={() => handleDelete(task)}
            >
              Eliminar
            </button>
          </div>
          <AnimatePresence initial={false}>
            {hasChildren && open && (
              <motion.div
                className="mt-2 pl-6 border-l"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {task.children!.map((c) => renderNode(c, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
          {openSubFormParentId === task.id && (
            <AnimatePresence initial={false}>
              <motion.div
                className="mt-3 rounded-lg border bg-gray-50 p-3"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmitSub((vals) => onSubmitSub(task.id, vals))();
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Título de la subtarea"
                      placeholder="Nombre de la subtarea"
                      {...subRegister("title", {
                        required: "El título es obligatorio",
                        minLength: { value: 3, message: "Mínimo 3 caracteres" },
                      })}
                      isInvalid={!!subErrors.title}
                      errorMessage={subErrors.title?.message as string}
                    />
                    <Controller
                      control={subControl}
                      name="priority"
                      rules={{ required: "Requerido" }}
                      render={({ field }) => (
                        <Select
                          label="Prioridad"
                          selectedKeys={[field.value]}
                          onSelectionChange={(keys) =>
                            field.onChange(Array.from(keys)[0] as any)
                          }
                          isInvalid={!!subErrors.priority}
                          errorMessage={subErrors.priority?.message as string}
                        >
                          <SelectItem key="low">Baja</SelectItem>
                          <SelectItem key="medium">Media</SelectItem>
                          <SelectItem key="high">Alta</SelectItem>
                        </Select>
                      )}
                    />
                    <Input
                      label="Responsable"
                      placeholder="Responsable"
                      {...subRegister("assignedTo")}
                    />
                    <Controller
                      control={subControl}
                      name="dueDate"
                      render={({ field }) => (
                        <DatePicker
                          label="Fecha límite"
                          value={toCalendarDate(field.value)}
                          onChange={(date) =>
                            field.onChange(date?.toString() || undefined)
                          }
                        />
                      )}
                    />
                    <Controller
                      control={subControl}
                      name="status"
                      rules={{ required: "Requerido" }}
                      render={({ field }) => (
                        <Select
                          label="Estado"
                          selectedKeys={[field.value]}
                          onSelectionChange={(keys) =>
                            field.onChange(Array.from(keys)[0] as any)
                          }
                          isInvalid={!!subErrors.status}
                          errorMessage={subErrors.status?.message as string}
                        >
                          <SelectItem key="pending">Pendiente</SelectItem>
                          <SelectItem key="in_progress">En progreso</SelectItem>
                          <SelectItem key="blocked">Bloqueada</SelectItem>
                          <SelectItem key="completed">Completada</SelectItem>
                        </Select>
                      )}
                    />
                    <Textarea
                      className="md:col-span-2"
                      label="Descripción"
                      placeholder="Descripción"
                      {...subRegister("description")}
                      minRows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      color="primary"
                      type="submit"
                      isLoading={isSaving || isSubmittingSub}
                    >
                      Crear subtarea
                    </Button>
                    <Button
                      variant="bordered"
                      onPress={() => setOpenSubFormParentId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </SortableItem>
    );
  };

  const handleRename = async (task: UiTask) => {
    const title = prompt("Nuevo título", task.title);
    if (!title || title === task.title) return;
    setIsSaving(true);
    try {
      await updateReportTask(task.id, { title });
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatus = async (task: UiTask, status: string) => {
    setIsSaving(true);
    try {
      await updateReportTask(task.id, { status: status as any });
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (task: UiTask) => {
    if (!confirm("¿Eliminar esta tarea? (Incluye sus subtareas)")) return;
    setIsSaving(true);
    try {
      await deleteReportTask(task.id);
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      layout
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Tareas del Caso</h2>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors"
        >
          {showNewForm ? "Cancelar" : "Nueva tarea"}
        </button>
      </div>

      {/* Counters */}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="px-2 py-1 rounded-full bg-gray-100">
          Pendientes: {statusCounts["pending"] || 0}
        </span>
        <span className="px-2 py-1 rounded-full bg-yellow-100">
          En progreso: {statusCounts["in_progress"] || 0}
        </span>
        <span className="px-2 py-1 rounded-full bg-rose-100">
          Bloqueadas: {statusCounts["blocked"] || 0}
        </span>
        <span className="px-2 py-1 rounded-full bg-green-100">
          Completadas: {statusCounts["completed"] || 0}
        </span>
        <span className="px-2 py-1 rounded-full bg-blue-100 ml-2">
          Alta: {priorityCounts["high"] || 0}
        </span>
        <span className="px-2 py-1 rounded-full bg-orange-100">
          Media: {priorityCounts["medium"] || 0}
        </span>
        <span className="px-2 py-1 rounded-full bg-slate-100">
          Baja: {priorityCounts["low"] || 0}
        </span>
      </div>

      {/* Animated create form with HeroUI + RHF */}
      <AnimatePresence initial={false}>
        {showNewForm && (
          <motion.div
            className="mb-4 rounded-lg border bg-gray-50 p-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(onSubmitRoot)();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Título"
                  placeholder="Título"
                  {...register("title", {
                    required: "El título es obligatorio",
                    minLength: { value: 3, message: "Mínimo 3 caracteres" },
                  })}
                  isInvalid={!!formErrors.title}
                  errorMessage={formErrors.title?.message as string}
                />
                <Controller
                  control={control}
                  name="priority"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <Select
                      label="Prioridad"
                      selectedKeys={[field.value]}
                      onSelectionChange={(keys) =>
                        field.onChange(Array.from(keys)[0] as any)
                      }
                      isInvalid={!!formErrors.priority}
                      errorMessage={formErrors.priority?.message as string}
                    >
                      <SelectItem key="low">Baja</SelectItem>
                      <SelectItem key="medium">Media</SelectItem>
                      <SelectItem key="high">Alta</SelectItem>
                    </Select>
                  )}
                />
                <Input
                  label="Responsable"
                  placeholder="Responsable"
                  {...register("assignedTo")}
                />
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <DatePicker
                      label="Fecha límite"
                      value={toCalendarDate(field.value)}
                      onChange={(date) =>
                        field.onChange(date?.toString() || undefined)
                      }
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="status"
                  rules={{ required: "Requerido" }}
                  render={({ field }) => (
                    <Select
                      label="Estado"
                      selectedKeys={[field.value]}
                      onSelectionChange={(keys) =>
                        field.onChange(Array.from(keys)[0] as any)
                      }
                      isInvalid={!!formErrors.status}
                      errorMessage={formErrors.status?.message as string}
                    >
                      <SelectItem key="pending">Pendiente</SelectItem>
                      <SelectItem key="in_progress">En progreso</SelectItem>
                      <SelectItem key="blocked">Bloqueada</SelectItem>
                      <SelectItem key="completed">Completada</SelectItem>
                    </Select>
                  )}
                />
                <Textarea
                  className="md:col-span-2"
                  label="Descripción"
                  placeholder="Descripción"
                  {...register("description")}
                  minRows={3}
                />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSaving || isSubmittingRoot}
                >
                  Crear tarea
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => setShowNewForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="text-gray-500">Cargando tareas...</div>
      ) : tasks.length === 0 ? (
        <div className="text-gray-500">No hay tareas. Crea la primera.</div>
      ) : (
        <div className="space-y-2">
          <RootDropzone />
          {tasks.map((t) => renderNode(t))}
          <RootBottomDropzone />
        </div>
      )}
    </motion.div>
  );
};
