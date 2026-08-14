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
        flex items-center gap-3 px-4 py-3 rounded-xl transition-[color,background-color,border-color,box-shadow] duration-200 ease-out border
        ${isCollapsed ? "justify-center" : "justify-start"}
        ${
          isActive
            ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 text-primary font-medium shadow-[0_10px_20px_-18px_rgba(16,185,129,0.8)]"
            : "border-transparent text-slate-600 hover:border-emerald-100 hover:bg-emerald-50/60 hover:text-[#0d212c]"
        }
      `}
      title={isCollapsed ? text : undefined}
    >
      <span
        className={`${
          isActive ? "text-primary" : "text-slate-500"
        } flex-shrink-0 transition-colors duration-200`}
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
