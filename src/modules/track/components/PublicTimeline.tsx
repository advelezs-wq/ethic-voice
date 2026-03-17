"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";

interface TimelineActivity {
  id: number;
  action: string;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

interface PublicTimelineProps {
  activities: TimelineActivity[];
}

const getIcon = (action: string) => {
  const iconMap: Record<string, string> = {
    "Denuncia recibida": "icon-[lucide--file-check]",
    "Investigador asignado": "icon-[lucide--user-check]",
    "Estado actualizado": "icon-[lucide--refresh-cw]",
    "Investigación iniciada": "icon-[lucide--search]",
    "Evidencia revisada": "icon-[lucide--clipboard-check]",
    "Caso resuelto": "icon-[lucide--check-circle]",
    "Caso cerrado": "icon-[lucide--x-circle]",
  };

  return iconMap[action] || "icon-[lucide--info]";
};

const getColor = (action: string) => {
  const colorMap: Record<string, string> = {
    "Denuncia recibida": "text-blue-600 bg-blue-100",
    "Investigador asignado": "text-green-600 bg-green-100",
    "Estado actualizado": "text-purple-600 bg-purple-100",
    "Investigación iniciada": "text-orange-600 bg-orange-100",
    "Evidencia revisada": "text-indigo-600 bg-indigo-100",
    "Caso resuelto": "text-green-600 bg-green-100",
    "Caso cerrado": "text-gray-600 bg-gray-100",
  };

  return colorMap[action] || "text-gray-600 bg-gray-100";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function PublicTimeline({ activities }: PublicTimelineProps) {
  // Sort activities by date (newest first)
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Cronología del Caso</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {sortedActivities.map((activity, index) => (
            <div key={activity.id} className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${getColor(
                  activity.action
                )} flex-shrink-0`}
              >
                <i
                  className={`${getIcon(activity.action)} size-4`}
                  role="img"
                  aria-hidden="true"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-8">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {activity.action}
                  </h4>
                  <time className="text-xs text-gray-500">
                    {formatDate(activity.createdAt)}
                  </time>
                </div>
                {activity.details && activity.details.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.details.description}
                  </p>
                )}
              </div>

              {/* Connector line (except for last item) */}
              {index < sortedActivities.length - 1 && (
                <div className="absolute left-4 top-8 w-px h-full bg-gray-200 -ml-px" />
              )}
            </div>
          ))}

          {sortedActivities.length === 0 && (
            <div className="text-center py-8">
              <i
                className="icon-[lucide--clock] size-8 text-gray-400 mx-auto mb-2"
                role="img"
                aria-hidden="true"
              />
              <p className="text-sm text-gray-500">
                No hay actualizaciones disponibles aún.
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
