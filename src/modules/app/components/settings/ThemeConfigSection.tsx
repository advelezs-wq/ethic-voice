"use client";

import { useState, useEffect } from "react";
import { Button, RadioGroup, Radio } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { useTheme } from "@/modules/core/providers/ThemeProvider";

interface ThemeConfigSectionProps {
  organizationId: string;
}

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
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "default",
    name: "Azul Corporativo",
    description: "Tema profesional con azules confiables y alto contraste",
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
    colors: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      accent: "#1F2937",
      background: "#111827",
    },
  },
];

export function ThemeConfigSection({}: ThemeConfigSectionProps) {
  const { settings, updateTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [saving, setSaving] = useState(false);

  // Load current theme from context
  useEffect(() => {
    if (settings?.theme) {
      setSelectedTheme(settings.theme);
    }
  }, [settings]);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleSaveTheme = async () => {
    setSaving(true);

    try {
      await updateTheme(selectedTheme);

      addToast({
        title: "Tema actualizado",
        description: "El esquema de colores ha sido actualizado exitosamente",
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

  const renderThemePreview = (theme: ThemeOption) => {
    const isDarkTheme = theme.id.includes("dark");
    const previewBg = isDarkTheme ? theme.colors.background : "#FFFFFF";
    const textColor = isDarkTheme ? "#F8FAFC" : "#1F2937";
    const subtextColor = isDarkTheme ? "#94A3B8" : "#6B7280";

    return (
      <div className="relative">
        <div
          className="border rounded-lg p-4 shadow-sm transition-all duration-200"
          style={{
            backgroundColor: previewBg,
            borderColor: isDarkTheme ? theme.colors.accent : "#E5E7EB",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.colors.accent }}
            />
          </div>

          <div
            className="h-16 rounded-md mb-3 flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: theme.colors.background }}
          >
            <div
              className="w-8 h-4 rounded mr-2"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div
              className="w-6 h-2 rounded"
              style={{ backgroundColor: theme.colors.secondary }}
            />

            {/* Mini UI elements */}
            <div className="absolute top-2 left-2 flex gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.colors.secondary }}
              />
            </div>

            <div className="absolute bottom-2 right-2">
              <div
                className="w-3 h-1 rounded"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
          </div>

          <h4 className="font-medium text-sm" style={{ color: textColor }}>
            {theme.name}
          </h4>
          <p className="text-xs mt-1" style={{ color: subtextColor }}>
            {theme.description}
          </p>
        </div>

        {selectedTheme === theme.id && (
          <div className="absolute -top-1 -right-1">
            <div className="bg-green-500 text-white rounded-full p-1.5 shadow-md">
              <i className="icon-[lucide--check] size-3" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Selecciona un Esquema de Colores
        </h4>

        <RadioGroup
          value={selectedTheme}
          onValueChange={handleThemeChange}
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEME_OPTIONS.map((theme) => (
              <Radio
                key={theme.id}
                value={theme.id}
                className="w-full data-[selected=true]:ring-2 data-[selected=true]:ring-primary rounded-lg"
              >
                {renderThemePreview(theme)}
              </Radio>
            ))}
          </div>
        </RadioGroup>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-medium text-gray-900">
              Vista Previa en Tiempo Real
            </h5>
            <p className="text-sm text-gray-600">
              Los cambios se aplicarán inmediatamente al guardar
            </p>
          </div>

          <Button
            color="primary"
            onPress={handleSaveTheme}
            isLoading={saving}
            isDisabled={saving}
          >
            <i className="icon-[lucide--save] size-4 mr-2" />
            Aplicar Tema
          </Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <i className="icon-[lucide--lightbulb] size-5 text-yellow-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-yellow-800">
              Personalización Avanzada
            </h5>
            <p className="text-sm text-yellow-700 mt-1">
              ¿Necesitas colores específicos de tu marca? Contacta a nuestro
              equipo de soporte para configurar un tema personalizado que
              coincida exactamente con tu identidad corporativa.
            </p>
            <Button size="sm" variant="flat" color="warning" className="mt-3">
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
