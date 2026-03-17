/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useReportActivities } from "../../hooks/useReportActivities";
import { ACTIVITY_TYPES } from "../../constants/reports";
import { formatDate, getTimeAgo } from "../../utils/reports";
import { createCustomReportActivity } from "@/actions/reports.actions";
import { FormSubmission } from "@/types/reports";
import { getPriorityLabel, getStatusLabel } from "../../utils/dashboard.utils";
import {
  getReportTypeLabel,
  getSourceLabel,
} from "../../utils/dashboard.utils";

interface ReportTimelineProps {
  reportId: number;
  report: FormSubmission;
}

export const ReportTimeline: React.FC<ReportTimelineProps> = ({
  reportId,
  report,
}) => {
  const { activities, isLoading, refetch } = useReportActivities(reportId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    type: "update" as const,
  });

  // Check if report is closed
  const isReportClosed =
    report.status === "CLOSED" || report.status === "RESOLVED";

  const getIcon = (action: keyof typeof ACTIVITY_TYPES) => {
    const icons = {
      [ACTIVITY_TYPES.CREATED]: (
        <i
          className="icon-[lucide--file-text] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.ASSIGNED]: (
        <i
          className="icon-[lucide--user] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.STATUS_CHANGED]: (
        <i
          className="icon-[lucide--settings] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.PRIORITY_CHANGED]: (
        <i
          className="icon-[lucide--circle-alert] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.COMMENT_ADDED]: (
        <i
          className="icon-[lucide--message-square] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.ATTACHMENT_UPLOADED]: (
        <i
          className="icon-[lucide--file-text] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.NOTE_ADDED]: (
        <i
          className="icon-[lucide--file-text] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
      [ACTIVITY_TYPES.CUSTOM_EVENT]: (
        <i
          className="icon-[lucide--calendar] size-5"
          role="img"
          aria-hidden="true"
        />
      ),
    };
    return (
      icons[action] || (
        <i
          className="icon-[lucide--calendar] size-5"
          role="img"
          aria-hidden="true"
        />
      )
    );
  };

  const getColor = (action: keyof typeof ACTIVITY_TYPES) => {
    const colors = {
      [ACTIVITY_TYPES.CREATED]: "bg-blue-100 text-blue-900",
      [ACTIVITY_TYPES.ASSIGNED]: "bg-green-100 text-green-900",
      [ACTIVITY_TYPES.STATUS_CHANGED]: "bg-purple-100 text-purple-900",
      [ACTIVITY_TYPES.PRIORITY_CHANGED]: "bg-orange-100 text-orange-900",
      [ACTIVITY_TYPES.COMMENT_ADDED]: "bg-indigo-100 text-indigo-900",
      [ACTIVITY_TYPES.ATTACHMENT_UPLOADED]: "bg-gray-100 text-gray-900",
      [ACTIVITY_TYPES.NOTE_ADDED]: "bg-yellow-100 text-yellow-900",
      [ACTIVITY_TYPES.CUSTOM_EVENT]: "bg-pink-100 text-pink-900",
    };
    return colors[action] || "bg-gray-100 text-gray-900";
  };

  const getTitle = (action: string, details?: any) => {
    const isTaskEvent = Boolean(details?.taskId);
    const isSubtask = Boolean(details?.parentTaskId);
    const EXTRA_ACTION_TITLES: Record<string, string> = {
      METADATA_UPDATED: "Metadatos actualizados",
      CREATED_MANUALLY: "Actividad creada manualmente",
      ai_analysis_completed: "Análisis de IA completado",
      urgent_action_required: "Acción urgente requerida",
      report_created: "Reporte creado por IA",
      auto_assigned_critical: "Asignación automática (crítico)",
      auto_assigned: "Asignación automática",
    };
    if (EXTRA_ACTION_TITLES[action]) return EXTRA_ACTION_TITLES[action];
    const titles = {
      [ACTIVITY_TYPES.CREATED]: "Reporte creado",
      [ACTIVITY_TYPES.ASSIGNED]: "Caso asignado",
      [ACTIVITY_TYPES.STATUS_CHANGED]: "Estado cambiado",
      [ACTIVITY_TYPES.PRIORITY_CHANGED]: "Prioridad cambiada",
      [ACTIVITY_TYPES.COMMENT_ADDED]: "Comentario agregado",
      [ACTIVITY_TYPES.ATTACHMENT_UPLOADED]: "Archivo adjuntado",
      [ACTIVITY_TYPES.NOTE_ADDED]: "Nota interna agregada",
      [ACTIVITY_TYPES.CUSTOM_EVENT]:
        details?.title ||
        (isTaskEvent
          ? isSubtask
            ? "Subtarea"
            : "Tarea"
          : "Evento personalizado"),
    } as const;
    return (
      titles[action as keyof typeof ACTIVITY_TYPES] ||
      (isTaskEvent
        ? isSubtask
          ? "Subtarea"
          : "Tarea"
        : action.replace(/_/g, " "))
    );
  };

  const getDescription = (action: string, details?: any) => {
    const isTaskEvent = Boolean(details?.taskId);
    const isSubtask = Boolean(details?.parentTaskId);
    if (action === "METADATA_UPDATED") {
      if (details?.updatedFields?.length) {
        return `Se actualizaron metadatos: ${details.updatedFields
          .map((f: string) => f.replace(/[_-]+/g, " ").toLowerCase())
          .join(", ")}`;
      }
      if (details?.type)
        return `Tipo: ${getReportTypeLabel(String(details.type))}`;
      return "Se actualizaron metadatos del caso";
    }
    if (action === "CREATED_MANUALLY") {
      return "Actividad del caso";
    }
    if (action === "ai_analysis_completed") {
      return `Análisis automático finalizado. Severidad: ${getPriorityLabel(String(details?.severity || ""))}`;
    }
    if (action === "urgent_action_required") {
      return details?.reason || "Se requiere acción urgente";
    }
    if (action === "report_created") {
      return "Reporte creado automáticamente";
    }
    if (action === "auto_assigned_critical") {
      return "El caso fue asignado automáticamente por prioridad crítica";
    }
    if (action === "auto_assigned") {
      return "El caso fue asignado automáticamente";
    }
    switch (action) {
      case ACTIVITY_TYPES.CREATED:
        return "El reporte fue enviado por el denunciante";
      case ACTIVITY_TYPES.ASSIGNED:
        return `El caso fue asignado a ${
          details?.assigneeName || "un investigador"
        }`;
      case ACTIVITY_TYPES.STATUS_CHANGED:
        return `Estado cambió de "${getStatusLabel(details?.oldStatus)}" a "${getStatusLabel(details?.newStatus)}"`;
      case ACTIVITY_TYPES.PRIORITY_CHANGED:
        return `Prioridad cambió de "${getPriorityLabel(details?.oldPriority)}" a "${getPriorityLabel(details?.newPriority)}"`;
      case ACTIVITY_TYPES.CUSTOM_EVENT:
        if (isTaskEvent) {
          const noun = isSubtask ? "subtarea" : "tarea";
          if (details?.description) return details.description;
          if (details?.title?.toLowerCase().includes("creada")) {
            return `Se creó la ${noun} #${details.taskId}: ${details?.taskTitle || "(Sin título)"}`;
          }
          if (details?.title?.toLowerCase().includes("actualizada")) {
            return `Se actualizó la ${noun} #${details.taskId}`;
          }
          return `Evento de ${noun} #${details.taskId}`;
        }
        return details?.description || "Evento personalizado agregado al caso";
      case ACTIVITY_TYPES.COMMENT_ADDED:
        return details?.isInternal
          ? "Se agregó un comentario interno"
          : "Se agregó un comentario";
      case ACTIVITY_TYPES.ATTACHMENT_UPLOADED:
        return `Se adjuntó el archivo "${details?.filename}"`;
      case ACTIVITY_TYPES.NOTE_ADDED:
        return "Se agregó una nota interna al caso";
      default:
        return "Actividad del caso";
    }
  };

  const handleSaveActivity = async () => {
    if (isSaving) return;
    if (!newActivity.title || !newActivity.description) {
      alert("Por favor completa el título y la descripción");
      return;
    }

    if (isReportClosed) {
      alert("No se pueden agregar eventos a un caso cerrado");
      return;
    }

    try {
      setIsSaving(true);
      await createCustomReportActivity(reportId, {
        title: newActivity.title,
        description: newActivity.description,
      });

      // Reset form and close
      setNewActivity({
        title: "",
        description: "",
        type: "update",
      });
      setShowAddForm(false);

      // Refresh activities
      refetch();
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Error al crear el evento");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-gray-500">Cargando cronología...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Cronología del Caso
          </h2>
          {isReportClosed && (
            <p className="text-sm text-gray-500 mt-1">
              Este caso está cerrado - los eventos están en modo solo lectura
            </p>
          )}
        </div>
        {!isReportClosed && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i
              className="icon-[lucide--plus] size-4"
              role="img"
              aria-hidden="true"
            />
            <span>Agregar Evento</span>
          </button>
        )}
      </div>

      {/* Closed Report Notice */}
      {isReportClosed && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
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
                Este caso ha sido cerrado. La cronología existente se muestra en
                modo solo lectura y no se pueden agregar nuevos eventos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Form */}
      {showAddForm && !isReportClosed && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Agregar Nuevo Evento
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={newActivity.title}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, title: e.target.value })
                }
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                placeholder="Título del evento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    description: e.target.value,
                  })
                }
                rows={3}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:opacity-50"
                placeholder="Descripción del evento"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSaveActivity}
                disabled={isSaving}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                disabled={isSaving}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-8">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No hay actividades registradas aún.</p>
              {isReportClosed && (
                <p className="text-sm mt-1">
                  Este caso no tiene eventos registrados.
                </p>
              )}
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="relative flex items-start space-x-4"
              >
                {/* Timeline dot */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full ${getColor(
                    activity.action as keyof typeof ACTIVITY_TYPES
                  )} flex items-center justify-center`}
                >
                  {getIcon(activity.action as keyof typeof ACTIVITY_TYPES)}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getTitle(activity.action, activity.details)}
                      </h3>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.createdAt)}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">
                      {getDescription(activity.action, activity.details)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Por: {activity.userName}
                    </p>

                    {/* Additional details */}
                    {activity.details &&
                      typeof activity.details === "object" &&
                      Object.keys(activity.details).length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            Detalles adicionales:
                          </p>
                          <div className="text-xs text-gray-500">
                            {activity.details.taskId && (
                              <div className="mb-2">
                                <a
                                  href={`?tab=tasks&task=${activity.details.taskId}`}
                                  className="text-blue-700 underline"
                                >
                                  Abrir{" "}
                                  {activity.details.parentTaskId
                                    ? "subtarea"
                                    : "tarea"}{" "}
                                  #{activity.details.taskId}
                                </a>
                              </div>
                            )}
                            {Object.entries(activity.details).map(
                              ([key, value]) => {
                                if (
                                  activity.action ===
                                    ACTIVITY_TYPES.CUSTOM_EVENT &&
                                  (key === "title" ||
                                    key === "description" ||
                                    key === "taskId")
                                ) {
                                  return null;
                                }
                                if (
                                  value === undefined ||
                                  value === null ||
                                  value === ""
                                )
                                  return null;
                                // Localize known keys/values
                                let label = key
                                  .replace(/([A-Z])/g, " $1")
                                  .trim()
                                  .toLowerCase();
                                let display: string = String(value);
                                switch (key) {
                                  case "type":
                                  case "irregularityType":
                                    label = "Tipo";
                                    display = getReportTypeLabel(String(value));
                                    break;
                                  case "priority":
                                    label = "Prioridad";
                                    display = getPriorityLabel(String(value));
                                    break;
                                  case "channel":
                                  case "channelType":
                                  case "source":
                                    label = "Canal";
                                    display = getSourceLabel(String(value));
                                    break;
                                  case "isAnonymous":
                                    label = "Anónimo";
                                    display =
                                      String(value).toLowerCase() === "true"
                                        ? "Sí"
                                        : "No";
                                    break;
                                  case "createdBy":
                                  case "createdByName":
                                    label = "Creado por";
                                    display = String(value);
                                    break;
                                  case "updatedFields":
                                  case "changed":
                                    label = "Campos actualizados";
                                    display = Array.isArray(value)
                                      ? (value as any[])
                                          .map((v) =>
                                            String(v)
                                              .replace(/[_-]+/g, " ")
                                              .toLowerCase()
                                          )
                                          .join(", ")
                                      : String(value);
                                    break;
                                  default:
                                    // Humanize generic slugs
                                    display = String(value)
                                      .replace(/[_-]+/g, " ")
                                      .toLowerCase();
                                }
                                return (
                                  <div key={key} className="mb-1">
                                    <span className="font-medium capitalize">
                                      {label}:
                                    </span>{" "}
                                    {display}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
