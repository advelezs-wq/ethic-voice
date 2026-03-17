import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Image } from "@heroui/react";

// Updated Compliance Platform Demo Component to match current design
const CompliancePlatformDemo = () => {
  return (
    <div className="relative mx-auto max-w-6xl px-3 sm:px-4 md:px-6">
      {/* Browser Window */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative rounded-xl shadow-2xl overflow-hidden bg-white"
      >
        {/* Browser Header */}
        <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="hidden sm:flex ml-4 items-center gap-2 bg-white rounded-md px-3 py-1 text-sm text-gray-600">
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

        {/* Dashboard Content */}
        <div className="flex flex-col md:flex-row h-[520px] md:h-[560px] lg:h-[640px]">
          {/* Sidebar */}
          <div className="w-14 md:w-16 lg:w-64 bg-white border-r border-gray-200 p-2 lg:p-4 relative flex flex-col">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8">
              <Image
                className="w-8 h-8 object-contain lg:hidden"
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
              />
              <Image
                className="hidden lg:block w-44 object-cover"
                src="/brand/logo-nobg.png"
                alt="EthicVoice"
              />
            </div>

            <nav className="space-y-1">
              <div className="bg-green-50 text-green-700 px-0 lg:px-3 py-3 rounded-lg flex items-center justify-center lg:justify-start gap-0 lg:gap-3">
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h2a2 2 0 012 2v6l-3 3-3-3V5z"
                  />
                </svg>
                <span className="font-medium hidden lg:inline">Dashboard</span>
              </div>

              {[
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
                  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                },
                {
                  name: "Configuración del Sistema",
                  icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                },
                {
                  name: "Perfil",
                  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="px-0 lg:px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center lg:justify-start gap-0 lg:gap-3 cursor-pointer"
                >
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
                      d={item.icon}
                    />
                  </svg>
                  <span className="text-sm hidden lg:inline">{item.name}</span>
                </div>
              ))}
            </nav>

            {/* User Profile */}
            <div className="absolute bottom-4 left-2 right-2 lg:left-4 lg:right-4">
              <button
                className="w-full mt-2 text-gray-600 hover:text-gray-800 flex items-center justify-center lg:justify-start gap-0 lg:gap-2 px-0 lg:px-3 py-2 text-xs lg:text-sm"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden lg:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    Panel de Control
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Gestión de denuncias y reportes de tu organización
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                    aria-label="Refrescar"
                    title="Refrescar"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
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
                  <button className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-600"
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
                    <span className="text-sm hidden sm:inline">Filtrar</span>
                  </button>
                  <button className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm hidden sm:inline">
                      Exportar PDF
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-blue-600 rounded-xl p-4 md:p-6 text-white relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm">Nuevos reportes</p>
                    <p className="text-2xl md:text-3xl font-bold">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500 rounded-xl p-4 md:p-6 text-white relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-orange-100 text-sm">En progreso</p>
                    <p className="text-2xl md:text-3xl font-bold">0</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-green-600 rounded-xl p-4 md:p-6 text-white relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-green-100 text-sm">Cerrados</p>
                    <p className="text-2xl md:text-3xl font-bold">0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
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
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Weekly Trend Chart */}
              <div className="md:col-span-2 bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">
                    Tendencia Semanal
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Opciones del gráfico"
                    title="Opciones del gráfico"
                  >
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
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                </div>
                <div className="h-40 md:h-48 bg-gray-50 rounded-lg flex items-end justify-center">
                  <div className="flex items-end gap-3 md:gap-4 mb-4">
                    {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map(
                      (day, idx) => (
                        <div key={idx} className="text-center">
                          <div
                            className={`w-6 md:w-8 bg-blue-500 rounded-t mb-2 ${idx === 6 ? "h-16" : "h-2"}`}
                          ></div>
                          <span className="text-xs text-gray-500">{day}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="text-center mt-4">
                  <span className="text-sm font-medium text-gray-900">mar</span>
                  <span className="text-sm text-gray-500 ml-2">0 reportes</span>
                </div>
              </div>

              {/* Monthly Statistics */}
              <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">
                    Estadísticas Mensuales
                  </h3>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Total de Reportes
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    0
                  </p>
                  <p className="text-xs text-gray-500">Últimos 6 meses</p>
                </div>
                <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-center">
                  <div className="flex items-end gap-1.5 md:gap-2 mb-4">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
              <div className="md:col-span-2 bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Reportes Recientes
                    </h3>
                    <span className="text-sm text-gray-500">0 total</span>
                  </div>
                  <button className="text-sm text-green-600 hover:text-green-700">
                    Ver todos
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center h-28 md:h-32">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  <p className="text-gray-500 text-sm">
                    No hay reportes recientes
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-6">
                  Indicador de Severidad
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Alta</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">0.0%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Media</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">0.0%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Baja</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">0.0%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">
                        Sin clasificar
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">0</div>
                      <div className="text-xs text-gray-500">0.0%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badges - keeping the existing ones */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="hidden md:flex absolute md:-left-8 lg:-left-20 bottom-20 bg-white rounded-lg shadow-lg p-4 items-center gap-3 animate-floating"
        style={{
          animation: "floating 3s ease-in-out infinite",
        }}
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-600"
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
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Ratio de verificación líder en la industria
          </p>
          <p className="text-xs text-gray-500">98% de casos resueltos</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="hidden md:block absolute md:-right-8 md:top-10 lg:-right-24 top-20 bg-white rounded-lg shadow-lg p-4 animate-floating"
        style={{
          animation: "floating 3s ease-in-out infinite 1.5s",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900">0</span>
          <span className="text-sm text-gray-600">Total reportes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-green-600">0.0%</span>
          <span className="text-xs text-gray-500">este mes</span>
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
  statsRef: React.RefObject<HTMLDivElement>;
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
