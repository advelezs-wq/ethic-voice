"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Image } from "@heroui/react";

type PreviewSidebarItem = {
  name: string;
  shortName?: string;
  icon: string;
};

/** Navegación del mock (compartida: barra móvil + sidebar desktop) */
const PREVIEW_SIDEBAR_ITEMS: PreviewSidebarItem[] = [
  {
    name: "Denuncias",
    icon: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    name: "Organización",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    name: "Correo",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    name: "Formularios",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    name: "Equipo",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  },
  {
    name: "Analíticas e Informes",
    shortName: "Analíticas",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    name: "Configuración del Sistema",
    shortName: "Configuración",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
];

const PREVIEW_PROFILE_ICON =
  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";

/** Mock del panel (ventana navegador + islas flotantes). Reutilizable en la landing. */
export const CompliancePlatformDemo = () => {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-1 sm:px-3 md:px-5 min-w-0">
      {/* Browser Window — escala contenida en viewport */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative max-w-full rounded-lg sm:rounded-xl shadow-xl sm:shadow-2xl overflow-hidden bg-white isolate"
      >
        {/* Browser Header */}
        <div className="bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between border-b border-gray-200 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1 shrink-0">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
            </div>
            <div className="hidden sm:flex ml-2 sm:ml-3 min-w-0 items-center gap-1.5 bg-white rounded px-2 py-0.5 text-xs text-gray-600">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>app.ethicvoice.com</span>
            </div>
          </div>
          <div className="hidden sm:flex text-xs text-gray-500 items-center gap-2">
            <span className="font-medium">Ethicvoice</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Dashboard: móvil = barra horizontal; desde 480px sidebar + contenido */}
        <div className="flex flex-col min-[480px]:flex-row overflow-hidden min-h-[280px] min-[480px]:min-h-[300px] h-[min(400px,84svh)] min-[480px]:h-[min(400px,78svh)] sm:h-[min(430px,74svh)] md:h-[min(460px,70svh)] lg:h-[min(500px,65svh)] xl:h-[min(520px,62svh)] max-h-[min(600px,90svh)]">
          {/* Móvil: una sola franja horizontal (logo + scroll + perfil/salir) — evita columna vacía */}
          <div
            className="flex min-[480px]:hidden items-stretch gap-1.5 border-b border-gray-200 bg-white px-2 py-1.5 shrink-0"
            aria-label="Navegación rápida del panel (vista previa)"
          >
            <div className="flex shrink-0 items-center py-0.5">
              <Image
                className="h-7 w-7 object-contain"
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
              />
            </div>
            <div className="flex min-h-[2.25rem] min-w-0 flex-1 flex-row items-center gap-0.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-700"
                title="Dashboard"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h2a2 2 0 012 2v6l-3 3-3-3V5z"
                  />
                </svg>
              </div>
              {PREVIEW_SIDEBAR_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  title={item.name}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 flex-row items-center gap-2 border-l border-gray-100 pl-2">
              <div
                title="Perfil"
                className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={PREVIEW_PROFILE_ICON}
                  />
                </svg>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop / tablet: sidebar vertical */}
          <div className="hidden min-[480px]:flex w-full min-[480px]:w-14 md:w-16 lg:w-52 xl:w-56 shrink-0 flex-col min-h-0 min-w-0 bg-white border-b min-[480px]:border-b-0 min-[480px]:border-r border-gray-200 p-1.5 sm:p-2 lg:p-3 min-[480px]:h-full min-[480px]:self-stretch">
            <div className="flex min-[480px]:items-center lg:justify-start justify-center gap-2 mb-2 sm:mb-3 lg:mb-4 shrink-0">
              <Image
                className="hidden min-[480px]:block lg:hidden h-8 w-8 object-contain"
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
              />
              <Image
                className="hidden lg:block w-32 xl:w-36 object-cover max-w-full"
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
              />
            </div>

            <nav
              className="min-h-0 flex-1 space-y-0.5 sm:space-y-1 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]"
              aria-label="Navegación del panel (vista previa)"
            >
              <div className="flex items-center justify-center gap-0 rounded-md bg-green-50 px-0 py-2 text-green-700 min-[480px]:py-2.5 lg:justify-start lg:gap-2 lg:px-2">
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h2a2 2 0 012 2v6l-3 3-3-3V5z"
                  />
                </svg>
                <span className="hidden font-medium lg:inline">Dashboard</span>
              </div>

              {PREVIEW_SIDEBAR_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  title={item.name}
                  className="flex min-w-0 cursor-default items-center justify-center gap-0 rounded-md px-0 py-1.5 text-gray-600 min-[480px]:py-2 hover:bg-gray-50 lg:justify-start lg:gap-2 lg:px-2"
                >
                  <svg
                    className="h-5 w-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  <span className="hidden text-left text-[11px] leading-snug line-clamp-2 break-words lg:inline lg:text-xs">
                    {item.shortName ?? item.name}
                  </span>
                </div>
              ))}
            </nav>

            <div className="mt-auto shrink-0 space-y-1.5 border-t border-gray-100 bg-white pt-2 pb-1">
              <div
                title="Perfil"
                className="flex min-w-0 cursor-default items-center justify-center gap-0 rounded-md px-0 py-1.5 text-gray-600 hover:bg-gray-50 min-[480px]:py-2 lg:justify-start lg:gap-2 lg:px-2"
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={PREVIEW_PROFILE_ICON}
                  />
                </svg>
                <span className="hidden truncate text-[11px] lg:inline lg:text-xs">Perfil</span>
              </div>
              <button
                type="button"
                className="flex w-full min-w-0 items-center justify-center gap-1 rounded-md px-0 py-1.5 text-[10px] text-gray-600 hover:bg-gray-50 min-[480px]:py-2 lg:justify-start lg:gap-1.5 lg:px-2 lg:text-xs"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden truncate lg:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-2 max-[479px]:px-3 sm:p-3 md:p-4 lg:p-5">
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 leading-tight">
                    Panel de Control
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm leading-snug">
                    Gestión de denuncias y reportes de tu organización
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    className="p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                    aria-label="Refrescar"
                    title="Refrescar"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                  <button className="p-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-gray-600 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                      />
                    </svg>
                    <span className="text-xs hidden sm:inline">Filtrar</span>
                  </button>
                  <button className="px-2 sm:px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Exportar PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-blue-600 rounded-lg p-3 sm:p-4 text-white relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-0">
                  <div className="min-w-0">
                    <p className="text-blue-100 text-[11px] sm:text-xs leading-tight">Nuevos reportes</p>
                    <p className="text-xl sm:text-2xl font-bold tabular-nums">0</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-md flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500 rounded-lg p-3 sm:p-4 text-white relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-orange-100 text-[11px] sm:text-xs leading-tight">En progreso</p>
                    <p className="text-xl sm:text-2xl font-bold tabular-nums">0</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-400 rounded-md flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-green-600 rounded-lg p-3 sm:p-4 text-white relative overflow-hidden sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-green-100 text-[11px] sm:text-xs leading-tight">Cerrados</p>
                    <p className="text-xl sm:text-2xl font-bold tabular-nums">0</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-500 rounded-md flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {/* Weekly Trend Chart */}
              <div className="md:col-span-2 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-0">
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    Tendencia Semanal
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5"
                    aria-label="Opciones del gráfico"
                    title="Opciones del gráfico"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                </div>
                <div className="h-28 sm:h-32 md:h-36 bg-gray-50 rounded-md flex items-end justify-center overflow-hidden px-1">
                  <div className="flex items-end justify-center gap-1 sm:gap-1.5 md:gap-2 mb-2 w-full max-w-full overflow-x-auto pb-1">
                    {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map(
                      (day, idx) => (
                        <div key={idx} className="text-center shrink-0 min-w-[1.35rem] sm:min-w-[1.5rem]">
                          <div
                            className={`mx-auto w-4 sm:w-5 md:w-6 bg-blue-500 rounded-t mb-1 ${idx === 6 ? "h-10 sm:h-12 md:h-14" : "h-1.5 sm:h-2"}`}
                          />
                          <span className="text-[10px] sm:text-xs text-gray-500 leading-none">{day}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="text-center mt-2 sm:mt-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-900">mar</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-2">0 reportes</span>
                </div>
              </div>

              {/* Monthly Statistics */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-0">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    Estadísticas Mensuales
                  </h3>
                </div>
                <div className="mb-2 sm:mb-3">
                  <p className="text-xs text-gray-600 mb-1">
                    Total de Reportes
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums">
                    0
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Últimos 6 meses</p>
                </div>
                <div className="h-24 sm:h-28 bg-gray-50 rounded-md flex items-end justify-center overflow-hidden">
                  <div className="flex items-end gap-1 sm:gap-1.5 mb-2 px-0.5">
                    {["feb", "mar", "abr", "may", "jun", "jul"].map(
                      (month, idx) => (
                        <div key={idx} className="text-center">
                          <div className="w-3 md:w-4 h-1 bg-gray-300 rounded-t mb-1"></div>
                          <span className="text-xs text-gray-400">{month}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports and Severity Indicator */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
              <div className="md:col-span-2 bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      Reportes Recientes
                    </h3>
                    <span className="text-xs text-gray-500">0 total</span>
                  </div>
                  <button className="text-xs text-green-600 hover:text-green-700 shrink-0">
                    Ver todos
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center h-20 sm:h-24 md:h-28">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm text-center px-2">
                    No hay reportes recientes
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-4">
                  Indicador de Severidad
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">Alta</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">0</div>
                      <div className="text-[10px] text-gray-500">0.0%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-yellow-500 rounded-full shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">Media</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">0</div>
                      <div className="text-[10px] text-gray-500">0.0%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">Baja</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">0</div>
                      <div className="text-[10px] text-gray-500">0.0%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-400 rounded-full shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-700 truncate">Sin clasificar</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">0</div>
                      <div className="text-[10px] text-gray-500">0.0%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Islas flotantes: solo lg+ para no cortarse en tablet; tamaño compacto */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="hidden lg:flex absolute z-[2] max-w-[11rem] xl:max-w-[14rem] left-1 xl:-left-6 2xl:-left-14 bottom-24 xl:bottom-28 bg-white rounded-lg shadow-lg p-2.5 xl:p-3 items-center gap-2 animate-floating pointer-events-none"
        style={{
          animation: "floating 3s ease-in-out infinite",
        }}
      >
        <div className="w-9 h-9 xl:w-10 xl:h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] xl:text-xs font-semibold text-gray-900 leading-snug">
            Ratio de verificación líder en la industria
          </p>
          <p className="text-[10px] xl:text-xs text-gray-500">98% de casos resueltos</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="hidden lg:block absolute z-[2] right-1 xl:-right-6 2xl:-right-14 top-16 xl:top-20 bg-white rounded-lg shadow-lg p-2.5 xl:p-3 animate-floating max-w-[10rem]"
        style={{
          animation: "floating 3s ease-in-out infinite 1.5s",
        }}
      >
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="text-lg xl:text-xl font-bold text-gray-900 tabular-nums">0</span>
          <span className="text-[11px] xl:text-xs text-gray-600 leading-tight">Total reportes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] xl:text-xs text-green-600">0.0%</span>
          <span className="text-[10px] xl:text-xs text-gray-500">este mes</span>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes floating {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-floating {
          animation: floating 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

const ComplianceStats = ({
  statsRef,
}: {
  statsRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const stats = [
    {
      value: "98%",
      label: "Tasa de resolución",
      description: "de casos resueltos exitosamente",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      value: "24/7",
      label: "Disponibilidad",
      description: "en más de 75 idiomas",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      value: "5K+",
      label: "Organizaciones",
      description: "confían en nosotros",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      value: "ISO 37002",
      label: "Gestión de denuncias",
      description: "",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div ref={statsRef} className="mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {stat.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stat.description}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// Main Component
export const PlatformPreviewSection = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  // Calendly URL with parameters
  const calendlyUrl =
    "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

  const openCalendlyPopup = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: calendlyUrl,
      });
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Animated Background Component (you'll need to import this) */}
      {/* <AnimatedBackground /> */}

      <div className="container-section relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 text-green-700 mb-6"
          >
            <span className="text-sm font-medium font-inter tracking-wide">
              Plataforma integral de ética y cumplimiento
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-inter font-bold text-4xl md:text-5xl lg:text-7xl tracking-tight max-w-4xl mx-auto mb-6 text-gray-900 leading-[1.1]"
          >
            De <span className="font-extrabold">Riesgos</span> a{" "}
            <span className="text-[#98D24C] font-extrabold">Confianza</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-inter text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Transforma el cumplimiento en tu ventaja competitiva con IA que
            protege tu organización
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16"
          >
            <button
              onClick={openCalendlyPopup}
              className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 group transition-colors flex items-center cursor-pointer"
            >
              Solicitar demo
              <svg
                className="ml-2 w-5 h-5 transition-transform group-hover:-rotate-45"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </motion.div>

          {/* Compliance Platform Showcase */}
          <motion.div ref={demoRef} variants={itemVariants}>
            <CompliancePlatformDemo />
          </motion.div>

          {/* Compliance Stats Section */}
          <ComplianceStats statsRef={statsRef} />
        </motion.div>
      </div>
    </section>
  );
};

/**
 * Bloque para la landing actual: título breve + preview de plataforma con islas flotantes
 * (sustituye la sección de testimonios en video).
 */
function PlatformPreviewWaveBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute left-1/2 top-[38%] h-[min(90%,520px)] w-[min(190%,1100px)] -translate-x-1/2 -translate-y-1/2 sm:top-[40%] sm:h-[min(95%,580px)]"
        viewBox="0 0 1000 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        >
          {/* Teal / aguamarina */}
          <path
            className="opacity-[0.28]"
            stroke="#5a9d9a"
            d="M-40 165 C120 95 280 210 440 145 S760 80 1040 155"
          />
          <path
            className="opacity-[0.22]"
            stroke="#4a8f8c"
            d="M-20 255 C180 320 360 140 540 230 S820 300 1020 195"
          />
          <path
            className="opacity-[0.2]"
            stroke="#6bb0ac"
            d="M0 340 C220 260 400 400 620 310 S900 360 1000 280"
          />
          {/* Oliva / verde suave */}
          <path
            className="opacity-[0.26]"
            stroke="#9aad6e"
            d="M-60 200 C140 280 320 120 500 200 S780 130 1060 220"
          />
          <path
            className="opacity-[0.2]"
            stroke="#b8c67a"
            d="M-30 295 C200 180 420 360 640 250 S880 200 1030 320"
          />
          <path
            className="opacity-[0.18]"
            stroke="#8a9f5c"
            d="M20 125 C260 200 480 60 700 140 S920 95 980 175"
          />
          <path
            className="opacity-[0.16]"
            stroke="#5a9d9a"
            d="M40 405 C280 330 520 480 760 390 S940 440 990 360"
          />
        </g>
      </svg>
    </div>
  );
}

export const PlatformPreviewShowcaseSection = () => {
  return (
    <section className="relative overflow-x-hidden bg-[#fafaf8] px-3 py-10 sm:px-6 sm:py-12 md:py-14 lg:px-8">
      <PlatformPreviewWaveBackground />
      <div className="relative z-10 mx-auto mb-6 max-w-3xl px-1 text-center sm:mb-8 sm:px-2 md:mb-10">
        <h2 className="mb-2 text-xl font-bold text-gray-900 sm:mb-3 sm:text-2xl md:text-3xl">
          La plataforma en acción
        </h2>
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          Vista previa del panel: gestión de denuncias, métricas y flujo de trabajo en un solo
          entorno.
        </p>
      </div>
      <div className="relative z-10">
        <CompliancePlatformDemo />
      </div>
    </section>
  );
};
