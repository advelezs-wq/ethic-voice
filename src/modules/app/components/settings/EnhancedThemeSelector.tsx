"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/modules/core/providers/ThemeProvider";
import { addToast } from "@/modules/core/utils/safe-toast";

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  category: "light" | "dark";
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "default",
    name: "Azul Corporativo",
    description: "Tema profesional con azules confiables y alto contraste",
    category: "light",
    colors: {
      primary: "#0066CC",
      secondary: "#4A90E2",
      accent: "#E8F4FD",
      background: "#FAFBFC",
    },
  },
  {
    id: "green",
    name: "Verde Empresarial",
    description: "Paleta moderna que transmite crecimiento y estabilidad",
    category: "light",
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#D1FAE5",
      background: "#F0FDF4",
    },
  },
  {
    id: "purple",
    name: "Púrpura Innovación",
    description: "Diseño sofisticado para organizaciones tecnológicas",
    category: "light",
    colors: {
      primary: "#7C3AED",
      secondary: "#8B5CF6",
      accent: "#EDE9FE",
      background: "#FDFCFF",
    },
  },
  {
    id: "orange",
    name: "Naranja Energético",
    description: "Colores vibrantes que proyectan dinamismo y creatividad",
    category: "light",
    colors: {
      primary: "#EA580C",
      secondary: "#F97316",
      accent: "#FED7AA",
      background: "#FFFBF5",
    },
  },
  {
    id: "dark",
    name: "Modo Oscuro Azul",
    description: "Elegante tema nocturno con excelente legibilidad",
    category: "dark",
    colors: {
      primary: "#3B82F6",
      secondary: "#60A5FA",
      accent: "#1E293B",
      background: "#0F172A",
    },
  },
  {
    id: "dark-green",
    name: "Modo Oscuro Verde",
    description: "Tema oscuro profesional con toques de crecimiento",
    category: "dark",
    colors: {
      primary: "#22C55E",
      secondary: "#4ADE80",
      accent: "#1F2937",
      background: "#111827",
    },
  },
  {
    id: "dark-purple",
    name: "Modo Oscuro Púrpura",
    description: "Diseño nocturno moderno para equipos innovadores",
    category: "dark",
    colors: {
      primary: "#A855F7",
      secondary: "#C084FC",
      accent: "#1F2937",
      background: "#111827",
    },
  },
  {
    id: "dark-orange",
    name: "Modo Oscuro Naranja",
    description: "Tema oscuro vibrante con máximo impacto visual",
    category: "dark",
    colors: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      accent: "#1F2937",
      background: "#111827",
    },
  },
];

export function EnhancedThemeSelector() {
  const { settings, updateTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [saving, setSaving] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    "light" | "dark" | "all"
  >("all");

  useEffect(() => {
    if (settings?.theme) {
      setSelectedTheme(settings.theme);
    }
  }, [settings]);

  const handleThemeChange = async (themeId: string) => {
    setSaving(true);
    setSelectedTheme(themeId);

    try {
      await updateTheme(themeId);
      addToast({
        title: "Tema actualizado",
        description: "El esquema de colores ha sido aplicado exitosamente",
        color: "success",
      });
    } catch {
      addToast({
        title: "Error",
        description: "No se pudo actualizar el tema. Intenta nuevamente",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredThemes = THEME_OPTIONS.filter(
    (theme) => activeCategory === "all" || theme.category === activeCategory
  );

  const renderThemePreview = (theme: ThemeOption) => {
    const isSelected = selectedTheme === theme.id;
    const isHovered = hoveredTheme === theme.id;
    const isDark = theme.category === "dark";

    return (
      <motion.div
        key={theme.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Card
          isPressable
          onPress={() => handleThemeChange(theme.id)}
          onMouseEnter={() => setHoveredTheme(theme.id)}
          onMouseLeave={() => setHoveredTheme(null)}
          className={`
            transition-all duration-300 cursor-pointer
            ${isSelected ? "ring-2 ring-offset-2" : "hover:shadow-lg"}
            ${isHovered ? "shadow-xl" : ""}
            relative overflow-hidden
          `}
          style={{
            backgroundColor: theme.colors.background,
            boxShadow: `0 0 0 2px ${theme.colors.primary}`,
          }}
        >
          <CardBody className="p-0">
            {/* Theme Preview Header */}
            <div
              className="h-12 flex items-center justify-between px-4"
              style={{ backgroundColor: theme.colors.accent }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center"
                >
                  <Chip
                    size="sm"
                    color="success"
                    variant="flat"
                    className="text-xs"
                  >
                    ✓ Activo
                  </Chip>
                </motion.div>
              )}
            </div>

            {/* Theme Content Preview */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="h-2 rounded-full flex-1 mr-2"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-8 h-2 rounded-full"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>

              <div className="space-y-2">
                <div
                  className="h-1.5 rounded-full w-3/4"
                  style={{ backgroundColor: isDark ? "#e2e8f0" : "#1e293b" }}
                />
                <div
                  className="h-1.5 rounded-full w-1/2"
                  style={{ backgroundColor: isDark ? "#94a3b8" : "#475569" }}
                />
              </div>

              {/* Action Button Preview */}
              <div className="flex justify-end">
                <div
                  className="px-3 py-1 rounded text-xs font-medium text-white transition-colors"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Botón
                </div>
              </div>
            </div>

            {/* Theme Info */}
            <div
              className="px-4 pb-4 border-t"
              style={{
                borderColor: theme.colors.accent,
                color: isDark ? "#f8fafc" : "#0f172a",
              }}
            >
              <h4 className="font-semibold text-sm mt-2 mb-1">{theme.name}</h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: isDark ? "#e2e8f0" : "#475569" }}
              >
                {theme.description}
              </p>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
              {saving && selectedTheme === theme.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm"
                >
                  <div className="bg-white rounded-full p-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeCategory === "all" ? "solid" : "bordered"}
          onPress={() => setActiveCategory("all")}
          className="transition-all"
        >
          Todos los Temas
        </Button>
        <Button
          size="sm"
          variant={activeCategory === "light" ? "solid" : "bordered"}
          onPress={() => setActiveCategory("light")}
          className="transition-all"
        >
          ☀️ Temas Claros
        </Button>
        <Button
          size="sm"
          variant={activeCategory === "dark" ? "solid" : "bordered"}
          onPress={() => setActiveCategory("dark")}
          className="transition-all"
        >
          🌙 Temas Oscuros
        </Button>
      </div>

      {/* Theme Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredThemes.map((theme) => renderThemePreview(theme))}
        </AnimatePresence>
      </motion.div>

      {/* Quick Info */}
      <Card className="bg-secondary border-blue-200">
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="icon-[lucide--palette] size-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Personalización Avanzada
              </h4>
              <p className="text-blue-700 text-sm">
                Los cambios se aplican instantáneamente a toda la plataforma.
                Cada tema está optimizado para máxima legibilidad y
                accesibilidad.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
