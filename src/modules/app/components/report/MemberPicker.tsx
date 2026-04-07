/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * MemberPicker — Selector de miembro con búsqueda, grupos por rol y soporte
 * para limpiar la asignación. Guarda el nombre legible (no el userId).
 *
 * El dropdown se renderiza via createPortal para escapar cualquier
 * overflow:hidden/auto del contenedor padre (modales, panels, etc.).
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export interface OrgMember {
  userId: string;
  /** Nombre completo para mostrar y guardar en assignedTo */
  userName: string;
  role: "ADMIN" | "MEMBER";
  department?: string | null;
  isBlocked?: boolean;
}

interface MemberPickerProps {
  /** Nombre actualmente asignado (se muestra en el botón) */
  value: string;
  /** Devuelve el nombre del miembro seleccionado, o "" para quitar asignación */
  onChange: (name: string) => void;
  members: OrgMember[];
  isLoading?: boolean;
  /** Texto del placeholder cuando no hay nadie asignado */
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  MEMBER: "Investigador",
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

interface DropdownStyle {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function MemberPicker({
  value,
  onChange,
  members,
  isLoading,
  placeholder = "Sin asignar",
  label,
  disabled,
  size = "md",
}: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<DropdownStyle>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Ensure we're on the client before using createPortal */
  useEffect(() => setMounted(true), []);

  /* Calculate dropdown position based on trigger rect */
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const GAP = 4;
    const DROPDOWN_HEIGHT = 300;

    const spaceBelow = viewportHeight - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;

    if (spaceBelow >= Math.min(DROPDOWN_HEIGHT, 180) || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        top: rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(DROPDOWN_HEIGHT, spaceBelow - 8),
      });
    } else {
      setDropdownStyle({
        bottom: viewportHeight - rect.top + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(DROPDOWN_HEIGHT, spaceAbove - 8),
      });
    }
  }, []);

  /* Open/close and position */
  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (!open) calcPosition();
    setOpen((v) => !v);
  }, [disabled, open, calcPosition]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Recalculate on scroll/resize while open */
  useEffect(() => {
    if (!open) return;
    const update = () => calcPosition();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, calcPosition]);

  /* Focus search on open */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQuery("");
  }, [open]);

  /* Filter + group */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !m.isBlocked)
      .filter(
        (m) =>
          !q ||
          m.userName.toLowerCase().includes(q) ||
          (m.department || "").toLowerCase().includes(q) ||
          ROLE_LABEL[m.role]?.toLowerCase().includes(q)
      );
  }, [members, query]);

  const admins = filtered.filter((m) => m.role === "ADMIN");
  const investigators = filtered.filter((m) => m.role === "MEMBER");

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const heightClass = size === "sm" ? "h-8 text-xs" : "h-10 text-sm";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";

  /* ── Dropdown content ── */
  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{
        position: "fixed",
        zIndex: 99999,
        left: dropdownStyle.left,
        width: Math.max(dropdownStyle.width, 260),
        minWidth: 260,
        ...(dropdownStyle.top !== undefined
          ? { top: dropdownStyle.top }
          : { bottom: dropdownStyle.bottom }),
        maxHeight: dropdownStyle.maxHeight,
      }}
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
          <i className="icon-[lucide--search] size-3.5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o departamento…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <i className="icon-[lucide--x] size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Options list */}
      <div className="overflow-y-auto overscroll-contain flex-1">
        {/* Clear option */}
        {value && (
          <button
            type="button"
            onClick={() => handleSelect("")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <i className="icon-[lucide--user-x] size-4 text-gray-400" />
            Sin asignar
          </button>
        )}

        {filtered.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <i className="icon-[lucide--users] size-8 text-gray-200 mx-auto mb-2 block" />
            <p className="text-sm text-gray-500">
              {members.length === 0
                ? "No hay miembros en la organización"
                : "Sin coincidencias para tu búsqueda"}
            </p>
          </div>
        ) : (
          <>
            {admins.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Administradores
                  </p>
                </div>
                {admins.map((m) => (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    isSelected={value === m.userName}
                    onSelect={() => handleSelect(m.userName)}
                  />
                ))}
              </div>
            )}

            {investigators.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Investigadores
                  </p>
                </div>
                {investigators.map((m) => (
                  <MemberRow
                    key={m.userId}
                    member={m}
                    isSelected={value === m.userName}
                    onSelect={() => handleSelect(m.userName)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: count */}
      {members.length > 0 && (
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 shrink-0">
          <p className="text-[10px] text-gray-400">
            {filtered.length} de {members.filter((m) => !m.isBlocked).length}{" "}
            miembro{members.filter((m) => !m.isBlocked).length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full">
      {label && (
        <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "w-full flex items-center gap-2 px-3 rounded-xl border transition-all text-left",
          heightClass,
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-50"
            : "bg-white cursor-pointer hover:border-blue-400 hover:bg-blue-50/20",
          open
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-gray-300",
        ].join(" ")}
      >
        {value ? (
          <>
            <span
              className={`${
                iconSize === "size-3.5" ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-xs"
              } rounded-full ${avatarColor(value)} text-white flex items-center justify-center font-semibold shrink-0`}
            >
              {initials(value)}
            </span>
            <span className="flex-1 truncate text-gray-800 text-sm">{value}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="shrink-0 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Quitar asignación"
            >
              <i className="icon-[lucide--x] size-3" />
            </button>
          </>
        ) : (
          <>
            <i className={`icon-[lucide--user] ${iconSize} text-gray-400 shrink-0`} />
            <span className="flex-1 text-gray-400 text-sm">
              {isLoading ? "Cargando equipo…" : placeholder}
            </span>
            <i
              className={`icon-[lucide--chevron-down] ${iconSize} text-gray-400 shrink-0 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown rendered via portal so escapes any overflow:hidden parent */}
      {mounted && open && createPortal(dropdownContent, document.body)}
    </div>
  );
}

function MemberRow({
  member,
  isSelected,
  onSelect,
}: {
  member: OrgMember;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      {/* Avatar */}
      <span
        className={`w-7 h-7 rounded-full ${avatarColor(
          member.userName
        )} text-white flex items-center justify-center text-[11px] font-semibold shrink-0`}
      >
        {initials(member.userName)}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {member.userName}
        </p>
        {member.department && (
          <p className="text-xs text-gray-400 truncate">{member.department}</p>
        )}
      </div>

      {/* Role badge + selected check */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            member.role === "ADMIN"
              ? "bg-violet-100 text-violet-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {member.role === "ADMIN" ? "Admin" : "Invest."}
        </span>
        {isSelected && (
          <i className="icon-[lucide--check] size-3.5 text-blue-600" />
        )}
      </div>
    </button>
  );
}
