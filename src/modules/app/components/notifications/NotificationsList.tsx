"use client";

import { ScrollShadow, Button, Spinner } from "@heroui/react";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  organization?: {
    name: string;
    slug: string;
  };
  report?: {
    id: number;
    aiSummary?: string;
  };
}

interface NotificationsListProps {
  onClose: () => void;
}

export const NotificationsList = ({ onClose }: NotificationsListProps) => {
  const { notifications, loading, markAsRead } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REPORT_CREATED":
        return "📝";
      case "REPORT_ASSIGNED":
        return "🎯";
      case "REPORT_URGENT":
        return "🚨";
      case "REPORT_STATUS_CHANGED":
        return "🔄";
      case "REPORT_COMMENT_ADDED":
        return "💬";
      case "SYSTEM_ALERT":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case "REPORT_URGENT":
        return "border-l-red-500 bg-red-50";
      case "REPORT_CREATED":
        return "border-l-blue-500 bg-blue-50";
      case "REPORT_ASSIGNED":
        return "border-l-green-500 bg-green-50";
      case "SYSTEM_ALERT":
        return "border-l-yellow-500 bg-yellow-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" color="primary" />
        <span className="ml-2 text-sm text-gray-500">
          Cargando notificaciones...
        </span>
      </div>
    );
  }

  // ✅ Add defensive check for undefined notifications
  if (!notifications || !Array.isArray(notifications)) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-sm mb-4">
          No hay notificaciones disponibles
        </p>
        <Button size="sm" variant="light" onPress={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-sm mb-4">
          No tienes notificaciones nuevas
        </p>
        <Button size="sm" variant="light" onPress={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <ScrollShadow className="max-h-96">
      <div className="divide-y divide-gray-200">
        {notifications.slice(0, 10).map((notification) => (
          <div
            key={notification.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
              !notification.readAt ? "bg-blue-50" : "bg-white"
            } ${getPriorityColor(notification.type)}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start space-x-3">
              <span className="text-xl flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${
                      !notification.readAt ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {!notification.readAt && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>

                <p
                  className={`text-sm mt-1 ${
                    !notification.readAt ? "text-gray-700" : "text-gray-500"
                  }`}
                >
                  {notification.message}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>

                  {notification.organization && (
                    <p className="text-xs text-gray-400 truncate ml-2">
                      {notification.organization.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {notifications.length > 10 && (
          <div className="p-4 text-center">
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                window.location.href = "/app/notifications";
                onClose();
              }}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </div>
    </ScrollShadow>
  );
};
