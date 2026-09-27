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

/** Ítem de navegación sobre tinta: el activo se marca con la barra lima del isotipo. */
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
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? text : undefined}
      className={`group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${
        isCollapsed ? "justify-center" : "justify-start"
      } ${
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-ev-signal transition-opacity duration-200 ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
      />
      <span
        className={`flex shrink-0 [&_i]:size-[18px] ${
          isActive ? "text-ev-signal" : "text-white/45 group-hover:text-white/80"
        }`}
      >
        {icon}
      </span>
      {!isCollapsed && (
        <span className="truncate tracking-[-0.005em]">{text}</span>
      )}
    </Link>
  );
};
