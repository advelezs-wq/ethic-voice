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
import { useSafeToast } from "../../hooks/useSafeToast";
import { Button, Input, Textarea } from "@heroui/react";

interface ReportTimelineProps {
  reportId: number;
  report: FormSubmission;
}

export const ReportTimeline: React.FC<ReportTimelineProps> = ({
  reportId,
  report,
}) => {
  const { activities, isLoading, refetch } = useReportActivities(reportId);
  const { showSuccess, showError } = useSafeToast();
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
      showError("Completa el título y la descripción");
      return;
    }
    if (isReportClosed) {
      showError("No se pueden agregar eventos a un caso cerrado");
      return;
    }
    try {
      setIsSaving(true);
      await createCustomReportActivity(reportId, {
        title: newActivity.title,
        description: newActivity.description,
      });
      setNewActivity({ title: "", description: "", type: "update" });
      setShowAddForm(false);
      showSuccess("Evento registrado en la cronología");
      refetch();
    } catch {
      showError("Error al crear el evento");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Cronología del caso
          </h2>
          {isReportClosed && (
            <p className="text-xs text-gray-500 mt-0.5">
              Caso cerrado — solo lectura
            </p>
          )}
        </div>
        {!isReportClosed && (
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => setShowAddForm(!showAddForm)}
            isDisabled={isSaving}
            startContent={<i className="icon-[lucide--plus] size-3.5" />}
          >
            Agregar evento
          </Button>
        )}
      </div>

      {/* Closed notice */}
      {isReportClosed && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <i className="icon-[lucide--lock] size-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Este caso está cerrado. La cronología es de solo lectura.
          </p>
        </div>
      )}

      {/* Add Activity Form */}
      {showAddForm && !isReportClosed && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <h3 className="text-sm font-semibold text-blue-900">
            Nuevo evento de investigación
          </h3>
          <Input
            label="Título del evento"
            size="sm"
            value={newActivity.title}
            onChange={(e) =>
              setNewActivity({ ...newActivity, title: e.target.value })
            }
            isDisabled={isSaving}
            placeholder="Ej: Entrevista con testigo, revisión de documentos…"
          />
          <Textarea
            label="Descripción"
            size="sm"
            value={newActivity.description}
            onChange={(e) =>
              setNewActivity({ ...newActivity, description: e.target.value })
            }
            isDisabled={isSaving}
            placeholder="Detalla qué ocurrió, qué se encontró, qué acción se tomó…"
            minRows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="light"
              onPress={() => setShowAddForm(false)}
              isDisabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              color="primary"
              onPress={handleSaveActivity}
              isLoading={isSaving}
              startContent={
                !isSaving && <i className="icon-[lucide--save] size-3.5" />
              }
            >
              Guardar evento
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Vertical line */}
        {activities.length > 0 && (
          <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-200" />
        )}

        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i className="icon-[lucide--clock] size-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">
                Sin actividades registradas
              </p>
              {!isReportClosed && (
                <p className="text-xs text-gray-400 mt-1">
                  Agrega eventos para documentar el progreso de la investigación.
                </p>
              )}
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="relative flex items-start gap-4"
              >
                {/* Icon dot */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full shrink-0 ${getColor(
                    activity.action as keyof typeof ACTIVITY_TYPES
                  )} flex items-center justify-center shadow-sm ring-2 ring-white`}
                >
                  {getIcon(activity.action as keyof typeof ACTIVITY_TYPES)}
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {getTitle(activity.action, activity.details)}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(activity.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {getDescription(activity.action, activity.details)}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <i className="icon-[lucide--user] size-3" />
                      {activity.userName}
                    </span>
                    <span>{formatDate(activity.createdAt)}</span>
                  </div>

                  {/* Task link */}
                  {activity.details?.taskId && (
                    <a
                      href={`?tab=tasks&task=${activity.details.taskId}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                    >
                      <i className="icon-[lucide--external-link] size-3" />
                      Ver {activity.details.parentTaskId ? "subtarea" : "tarea"}{" "}
                      #{activity.details.taskId}
                    </a>
                  )}

                  {/* Extra details — only show keys not already in description */}
                  {activity.details &&
                    typeof activity.details === "object" &&
                    Object.keys(activity.details).length > 0 &&
                    !activity.details.taskId && (
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-x-4 gap-y-1">
                        {Object.entries(activity.details).map(([key, value]) => {
                          // Keys already shown in title/description or purely internal — skip
                          const SKIP_KEYS = new Set([
                            "title", "description", "taskId", "taskTitle",
                            "parentTaskId", "preview", "isInternal",
                            // STATUS_CHANGED & PRIORITY_CHANGED are in getDescription()
                            "oldStatus", "newStatus", "oldPriority", "newPriority",
                            // ASSIGNED is in getDescription()
                            "assigneeName", "assigneeId",
                            // type:"custom" is noise
                          ]);
                          if (SKIP_KEYS.has(key)) return null;
                          if (key === "type" && String(value) === "custom") return null;
                          if (value === undefined || value === null || value === "") return null;

                          // Spanish label map
                          const LABEL_MAP: Record<string, string> = {
                            type: "Tipo",
                            irregularityType: "Tipo de irregularidad",
                            priority: "Prioridad",
                            channel: "Canal",
                            channelType: "Canal",
                            source: "Fuente",
                            isAnonymous: "Anónimo",
                            createdBy: "Creado por",
                            createdByName: "Creado por",
                            updatedFields: "Campos actualizados",
                            changed: "Campos actualizados",
                            severity: "Severidad",
                            reason: "Motivo",
                            confidence: "Confianza",
                          };

                          const label =
                            LABEL_MAP[key] ||
                            key
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .toLowerCase();

                          let display: string;
                          switch (key) {
                            case "type":
                            case "irregularityType":
                              display = getReportTypeLabel(String(value));
                              break;
                            case "priority":
                            case "severity":
                              display = getPriorityLabel(String(value));
                              break;
                            case "channel":
                            case "channelType":
                            case "source":
                              display = getSourceLabel(String(value));
                              break;
                            case "isAnonymous":
                              display =
                                String(value).toLowerCase() === "true" ? "Sí" : "No";
                              break;
                            case "updatedFields":
                            case "changed":
                              display = Array.isArray(value)
                                ? (value as any[])
                                    .map((v) =>
                                      String(v).replace(/[_-]+/g, " ").toLowerCase()
                                    )
                                    .join(", ")
                                : String(value);
                              break;
                            default:
                              display = String(value)
                                .replace(/[_-]+/g, " ")
                                .replace(/^\w/, (c) => c.toUpperCase());
                          }

                          return (
                            <div key={key} className="text-xs">
                              <span className="font-medium text-gray-500 capitalize">
                                {label}:
                              </span>{" "}
                              <span className="text-gray-700">{display}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
