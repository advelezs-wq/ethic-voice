"use client";

import { useState } from "react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
} from "@heroui/react";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationsList } from "./NotificationsList";

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="relative overflow-visible"
        >
          <i
            className="icon-[lucide--bell-ring] size-4"
            role="img"
            aria-hidden="true"
          />
          {unreadCount > 0 && (
            <Chip
              size="sm"
              color="danger"
              className="absolute -top-1 -right-1 text-xs h-4 p-0"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Chip>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0">
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between w-full">
          <h3 className="font-semibold text-gray-900">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="light"
              onPress={handleMarkAllAsRead}
              className="text-blue-600 hover:text-blue-800"
              isDisabled={false}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        <NotificationsList onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
