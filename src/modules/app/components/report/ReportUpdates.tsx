/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ReportUpdate } from "@/types/reports";
import React, { useState, useEffect, useCallback } from "react";
import {
  calculateDaysOverdue,
  formatDate,
  isOverdue,
} from "../../utils/reports";
import {
  getReportUpdates,
  createReportUpdate,
  updateReportUpdate,
  deleteReportUpdate,
} from "@/actions/reports.actions";
import { FormSubmission } from "@/types/reports";
import { getSlaStageDays } from "../../utils/dashboard.utils";

interface ReportUpdatesProps {
  reportId: number;
  report: FormSubmission;
}

export const ReportUpdates: React.FC<ReportUpdatesProps> = ({
  reportId,
  report,
}) => {
  const [updates, setUpdates] = useState<ReportUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ReportUpdate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "low" | "medium",
    dueDate: "",
    assignedTo: "",
  });

  // Check if report is closed
  const isReportClosed =
    report.status === "CLOSED" || report.status === "RESOLVED";

  // Load updates on component mount
  const loadUpdates = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedUpdates = await getReportUpdates(reportId);
      setUpdates(fetchedUpdates);
    } catch (error) {
      console.error("Error loading updates:", error);
      alert("Error al cargar las actualizaciones");
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: (
        <i
          className="icon-[lucide--clock] size-4"
          role="img"
          aria-hidden="true"
        />
      ),
      in_progress: (
        <i
          className="icon-[lucide--circle-alert] size-4"
          role="img"
          aria-hidden="true"
        />
      ),
      completed: (
        <i
          className="icon-[lucide--circle-check-big] size-4"
          role="img"
          aria-hidden="true"
        />
      ),
    };
    return icons[status as keyof typeof icons];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendiente",
      in_progress: "En progreso",
      completed: "Completado",
    };
    return labels[status as keyof typeof labels];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-orange-100 text-orange-800",
      high: "bg-red-100 text-red-800",
    };
    return colors[priority as keyof typeof colors];
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
    };
    return labels[priority as keyof typeof labels];
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.title || !newUpdate.description) {
      alert("Por favor completa el título y la descripción");
      return;
    }

    if (isReportClosed) {
      alert("No se pueden agregar actualizaciones a un caso cerrado");
      return;
    }

    try {
      setIsSaving(true);
      const createdUpdate = await createReportUpdate(reportId, {
        title: newUpdate.title,
        description: newUpdate.description,
        priority: newUpdate.priority,
        dueDate: newUpdate.dueDate || undefined,
        assignedTo: newUpdate.assignedTo || undefined,
      });

      // Add to local state
      setUpdates([createdUpdate, ...updates]);
      resetForm();
    } catch (error) {
      console.error("Error creating update:", error);
      alert("Error al crear la actualización");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUpdate = (update: ReportUpdate) => {
    if (isReportClosed) {
      alert("No se pueden editar actualizaciones de un caso cerrado");
      return;
    }

    setEditingUpdate(update);
    setNewUpdate({
      title: update.title,
      description: update.description,
      priority: update.priority as "high" | "low" | "medium",
      dueDate: update.dueDate
        ? new Date(update.dueDate).toISOString().slice(0, 16)
        : "",
      assignedTo: update.assignedTo || "",
    });
    setShowAddForm(true);
  };

  const handleUpdateStatus = async (
    updateId: number,
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    if (isReportClosed) {
      alert(
        "No se puede cambiar el estado de actualizaciones en un caso cerrado"
      );
      return;
    }

    const update = updates.find((u) => u.id === updateId);
    if (!update) return;

    try {
      const updatedUpdate = await updateReportUpdate(updateId, {
        title: update.title,
        description: update.description,
        priority: update.priority as "low" | "medium" | "high",
        status: newStatus,
        dueDate: update.dueDate
          ? typeof update.dueDate === "string"
            ? update.dueDate
            : update.dueDate.toISOString()
          : undefined,
        assignedTo: update.assignedTo || undefined,
      });

      // Update local state
      setUpdates(updates.map((u) => (u.id === updateId ? updatedUpdate : u)));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado");
    }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    if (isReportClosed) {
      alert("No se pueden eliminar actualizaciones de un caso cerrado");
      return;
    }

    if (!confirm("¿Estás seguro de que quieres eliminar esta actualización?")) {
      return;
    }

    try {
      await deleteReportUpdate(updateId);
      setUpdates(updates.filter((u) => u.id !== updateId));
    } catch (error) {
      console.error("Error deleting update:", error);
      alert("Error al eliminar la actualización");
    }
  };

  const resetForm = () => {
    setNewUpdate({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
    });
    setEditingUpdate(null);
    setShowAddForm(false);
  };

  const saveUpdate = async () => {
    if (!newUpdate.title || !newUpdate.description) {
      alert("Por favor completa el título y la descripción");
      return;
    }

    if (isReportClosed) {
      alert("No se pueden modificar actualizaciones en un caso cerrado");
      return;
    }

    try {
      setIsSaving(true);
      if (editingUpdate) {
        const updatedUpdate = await updateReportUpdate(editingUpdate.id, {
          title: newUpdate.title,
          description: newUpdate.description,
          priority: newUpdate.priority,
          status: editingUpdate.status as
            | "pending"
            | "in_progress"
            | "completed",
          dueDate: newUpdate.dueDate || undefined,
          assignedTo: newUpdate.assignedTo || undefined,
        });

        setUpdates(
          updates.map((u) => (u.id === editingUpdate.id ? updatedUpdate : u))
        );
      } else {
        await handleAddUpdate();
      }
      resetForm();
    } catch (error) {
      console.error("Error saving update:", error);
      alert("Error al guardar la actualización");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Actualizaciones del Caso
            </h2>
            {isReportClosed && (
              <p className="text-sm text-gray-500 mt-1">
                Este caso está cerrado - las actualizaciones están en modo solo
                lectura
              </p>
            )}
          </div>
          {!isReportClosed && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isSaving}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i
                className="icon-[lucide--plus] size-4"
                role="img"
                aria-hidden="true"
              />
              <span>Nueva Actualización</span>
            </button>
          )}
        </div>

        {!isReportClosed && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Acciones rápidas (Plan de acción)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(() => {
                const stages = getSlaStageDays(
                  report.type || report.priority,
                  report.type
                );
                const now = new Date();
                const makeDue = (days: number) =>
                  new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 16);
                const presets = [
                  {
                    title: "Acuse de recibo",
                    description:
                      "Enviar acuse de recibo al denunciante y registrar confirmación.",
                    priority: "medium" as const,
                    dueDate: makeDue(stages.ackDays),
                  },
                  {
                    title: "Asignación de investigador",
                    description:
                      "Asignar responsable y establecer alcance inicial de la investigación.",
                    priority: "medium" as const,
                    dueDate: makeDue(stages.assignDays),
                  },
                  {
                    title: "Plan de investigación",
                    description:
                      "Definir plan de investigación, fuentes, entrevistas y cronograma.",
                    priority: "high" as const,
                    dueDate: makeDue(
                      Math.max(1, Math.floor(stages.investigateDays / 3))
                    ),
                  },
                  {
                    title: "Recopilar evidencias",
                    description:
                      "Recolección documental y técnica (logs, correos, accesos).",
                    priority: "high" as const,
                    dueDate: makeDue(
                      Math.max(1, Math.floor(stages.investigateDays * 0.66))
                    ),
                  },
                  {
                    title: "Entrevistas clave",
                    description:
                      "Entrevistar a denunciado(s) y testigos conforme a protocolo.",
                    priority: "medium" as const,
                    dueDate: makeDue(Math.max(1, stages.investigateDays - 2)),
                  },
                  {
                    title: "Cierre y comunicación",
                    description:
                      "Documentar hallazgos y comunicar resultado a partes correspondientes.",
                    priority: "medium" as const,
                    dueDate: makeDue(stages.totalDays),
                  },
                ];
                return presets.map((p, idx) => (
                  <button
                    key={idx}
                    aria-label={`Crear acción: ${p.title}`}
                    title={`Crear acción: ${p.title}`}
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await createReportUpdate(reportId, {
                          title: p.title,
                          description: p.description,
                          priority: p.priority,
                          dueDate: p.dueDate,
                        });
                        await loadUpdates();
                      } catch (e) {
                        console.error(e);
                        alert("No se pudo crear la acción rápida");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="text-left border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {p.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {p.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Vence aprox. en {p.dueDate.slice(0, 10)}
                    </div>
                  </button>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Closed Report Notice */}
      {isReportClosed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Este caso ha sido cerrado. Las actualizaciones existentes se
                muestran en modo solo lectura y no se pueden crear nuevas
                actualizaciones ni modificar las existentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Update Form */}
      {showAddForm && !isReportClosed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUpdate
              ? "Editar Actualización"
              : "Agregar Nueva Actualización"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={newUpdate.title}
                onChange={(e) =>
                  setNewUpdate({ ...newUpdate, title: e.target.value })
                }
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                placeholder="Título de la actualización"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={newUpdate.description}
                onChange={(e) =>
                  setNewUpdate({ ...newUpdate, description: e.target.value })
                }
                rows={3}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                placeholder="Descripción detallada de la actualización"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={newUpdate.priority}
                  onChange={(e) =>
                    setNewUpdate({
                      ...newUpdate,
                      priority: e.target.value as any,
                    })
                  }
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha límite
                </label>
                <input
                  type="datetime-local"
                  value={newUpdate.dueDate}
                  onChange={(e) =>
                    setNewUpdate({ ...newUpdate, dueDate: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asignado a
                </label>
                <input
                  type="text"
                  value={newUpdate.assignedTo}
                  onChange={(e) =>
                    setNewUpdate({ ...newUpdate, assignedTo: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={saveUpdate}
                disabled={isSaving}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? "Guardando..."
                  : editingUpdate
                    ? "Actualizar"
                    : "Guardar"}
              </button>
              <button
                onClick={resetForm}
                disabled={isSaving}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Updates List */}
      <div className="space-y-4">
        {updates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No hay actualizaciones registradas.</p>
            <p className="text-sm text-gray-400 mt-1">
              {isReportClosed
                ? "Este caso no tiene actualizaciones registradas."
                : "Agrega la primera actualización para comenzar el seguimiento."}
            </p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        update.status
                      )}`}
                    >
                      {getStatusIcon(update.status)}
                      <span>{getStatusLabel(update.status)}</span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        update.priority
                      )}`}
                    >
                      {getPriorityLabel(update.priority)}
                    </span>
                    {update.dueDate &&
                      isOverdue(
                        typeof update.dueDate === "string"
                          ? update.dueDate
                          : update.dueDate.toISOString()
                      ) && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Vencida (
                          {calculateDaysOverdue(
                            typeof update.dueDate === "string"
                              ? update.dueDate
                              : update.dueDate.toISOString()
                          )}{" "}
                          días)
                        </span>
                      )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {update.title}
                  </h3>
                  <p className="text-gray-700 mb-3">{update.description}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {update.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <i
                          className="icon-[lucide--user] size-4"
                          role="img"
                          aria-hidden="true"
                        />
                        <span>{update.assignedTo}</span>
                      </div>
                    )}
                    {update.dueDate && (
                      <div className="flex items-center space-x-1">
                        <i
                          className="icon-[lucide--calendar] size-4"
                          role="img"
                          aria-hidden="true"
                        />
                        <span>
                          Vence:{" "}
                          {formatDate(
                            typeof update.dueDate === "string"
                              ? update.dueDate
                              : update.dueDate.toISOString()
                          )}
                        </span>
                      </div>
                    )}
                    <span>
                      Actualizado:{" "}
                      {update.updatedAt
                        ? formatDate(
                            typeof update.updatedAt === "string"
                              ? update.updatedAt
                              : update.updatedAt.toISOString()
                          )
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status quick actions */}
                  {!isReportClosed && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleUpdateStatus(update.id, "pending")}
                        className={`p-1 rounded ${
                          update.status === "pending"
                            ? "bg-gray-200"
                            : "hover:bg-gray-100"
                        }`}
                        title="Marcar como pendiente"
                      >
                        <i
                          className="icon-[lucide--clock] size-4 text-gray-600"
                          role="img"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(update.id, "in_progress")
                        }
                        className={`p-1 rounded ${
                          update.status === "in_progress"
                            ? "bg-yellow-200"
                            : "hover:bg-yellow-100"
                        }`}
                        title="Marcar como en progreso"
                      >
                        <i
                          className="icon-[lucide--circle-alert] size-4 text-yellow-600"
                          role="img"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(update.id, "completed")
                        }
                        className={`p-1 rounded ${
                          update.status === "completed"
                            ? "bg-green-200"
                            : "hover:bg-green-100"
                        }`}
                        title="Marcar como completado"
                      >
                        <i
                          className="icon-[lucide--circle-check-big] size-4 text-green-600"
                          role="img"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  )}

                  {!isReportClosed && (
                    <>
                      <button
                        onClick={() => handleEditUpdate(update)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <i
                          className="icon-[iconamoon--edit] size-4"
                          role="img"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(update.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <i
                          className="icon-[lucide--trash] size-4"
                          role="img"
                          aria-hidden="true"
                        />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
