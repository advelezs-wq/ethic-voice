"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface SidebarItemProps {
  icon: ReactNode;
  text: string;
  to: string;
  isActive: boolean;
  isCollapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  text,
  to,
  isActive,
  isCollapsed = false,
}) => {
  return (
    <Link
      href={to}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 ease-in-out
        ${isCollapsed ? "justify-center" : "justify-start"}
        ${
          isActive
            ? "bg-primary-50 text-primary font-medium"
            : "text-gray-700 hover:bg-background hover:text-gray-900"
        }
      `}
      title={isCollapsed ? text : undefined}
    >
      <span
        className={`${
          isActive ? "text-primary" : "text-gray-600"
        } flex-shrink-0 transition-colors duration-300`}
      >
        {icon}
      </span>
      <span
        className={`text-sm transition-all duration-300 ${
          isCollapsed ? "hidden" : "w-auto opacity-100"
        } overflow-hidden whitespace-nowrap`}
      >
        {text}
      </span>
    </Link>
  );
};
