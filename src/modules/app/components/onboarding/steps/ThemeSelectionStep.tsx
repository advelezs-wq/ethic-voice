"use client";

import React, { useState } from "react";
import { Button, RadioGroup, Radio } from "@heroui/react";
import { motion } from "framer-motion";
import { useOrganization } from "@clerk/nextjs";
import { OnboardingContextType } from "../OnboardingClient";

interface ThemeSelectionStepProps {
  context: OnboardingContextType;
}

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  category: "light" | "dark";
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
    description: "Diseño profesional y confiable para equipos serios",
    category: "light",
    colors: {
      primary: "#0066CC",
      secondary: "#4A90E2",
      accent: "#E3F2FD",
      background: "#F8FAFC",
    },
  },
  {
    id: "green",
    name: "Verde Fresco",
    description: "Tema vibrante que inspira crecimiento y productividad",
    category: "light",
    colors: {
      primary: "#10B981",
      secondary: "#34D399",
      accent: "#ECFDF5",
      background: "#F9FAFB",
    },
  },
  {
    id: "purple",
    name: "Púrpura Creativo",
    description: "Para equipos creativos que buscan inspiración",
    category: "light",
    colors: {
      primary: "#8B5CF6",
      secondary: "#A78BFA",
      accent: "#F3E8FF",
      background: "#FAFAFA",
    },
  },
  {
    id: "orange",
    name: "Naranja Energético",
    description: "Dinámico y vibrante para equipos activos",
    category: "light",
    colors: {
      primary: "#F59E0B",
      secondary: "#FBBF24",
      accent: "#FEF3C7",
      background: "#FFFBEB",
    },
  },
  {
    id: "dark-blue",
    name: "Modo Oscuro Azul",
    description: "Elegante y profesional para trabajo nocturno",
    category: "dark",
    colors: {
      primary: "#3B82F6",
      secondary: "#60A5FA",
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
];

export function ThemeSelectionStep({ context }: ThemeSelectionStepProps) {
  const { goToPreviousStep, goToNextStep, selectedTheme, setSelectedTheme } =
    context;
  const { organization } = useOrganization();
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "light" | "dark" | "all"
  >("all");

  const handleThemeSelection = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleSkip = () => {
    goToNextStep();
  };

  const handleContinue = async () => {
    if (!organization?.id) {
      goToNextStep();
      return;
    }

    setSaving(true);
    try {
      const themeColors = THEME_OPTIONS.find(
        (t) => t.id === selectedTheme
      )?.colors;
      if (!themeColors) {
        goToNextStep();
        return;
      }

      const response = await fetch("/api/organization/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organization.id,
          settings: {
            theme: selectedTheme,
            primaryColor: themeColors.primary,
            secondaryColor: themeColors.secondary,
            accentColor: themeColors.accent,
            backgroundColor: themeColors.background,
          },
        }),
      });

      if (response.ok) {
        // Optimistic feedback
        console.log("✅ [ONBOARDING] Theme applied successfully");
      }
    } catch (error) {
      console.error("❌ [ONBOARDING] Error applying theme:", error);
    } finally {
      setSaving(false);
      goToNextStep();
    }
  };

  const filteredThemes = THEME_OPTIONS.filter(
    (theme) => activeCategory === "all" || theme.category === activeCategory
  );

  const renderThemePreview = (theme: ThemeOption) => (
    <div className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
      {/* Theme Preview Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.accent }}
          />
        </div>
        <span className="text-xs text-gray-500 capitalize">
          {theme.category === "light" ? "🌞" : "🌙"}
        </span>
      </div>

      {/* Mini Dashboard Preview */}
      <div
        className="rounded-md p-3 mb-3"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="flex items-center justify-between mb-2">
          <div
            className="w-12 h-2 rounded"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>
        </div>
        <div
          className="w-full h-6 rounded mb-2"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div className="flex space-x-2">
          <div
            className="w-8 h-3 rounded"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div className="w-6 h-3 rounded bg-gray-300" />
        </div>
      </div>

      {/* Theme Info */}
      <div>
        <h4 className="font-medium text-gray-900 text-sm mb-1">{theme.name}</h4>
        <p className="text-xs text-gray-600">{theme.description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">🎨</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Personaliza tu experiencia
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Elige el esquema de colores que mejor represente a tu organización.
          Puedes cambiarlo en cualquier momento desde la configuración.
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveCategory("light")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCategory === "light"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🌞 Claro
          </button>
          <button
            onClick={() => setActiveCategory("dark")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeCategory === "dark"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🌙 Oscuro
          </button>
        </div>
      </motion.div>

      {/* Theme Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        <RadioGroup
          value={selectedTheme}
          onValueChange={handleThemeSelection}
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => (
              <Radio
                key={theme.id}
                value={theme.id}
                className="w-full data-[selected=true]:ring-2 data-[selected=true]:ring-blue-500 rounded-lg"
              >
                {renderThemePreview(theme)}
              </Radio>
            ))}
          </div>
        </RadioGroup>
      </motion.div>

      {/* Selected Theme Info */}
      {selectedTheme && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-4 max-w-2xl mx-auto"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-medium text-blue-900">
                Tema seleccionado:{" "}
                {THEME_OPTIONS.find((t) => t.id === selectedTheme)?.name}
              </p>
              <p className="text-sm text-blue-700">
                Los cambios se aplicarán inmediatamente a tu dashboard
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons - sticky to improve visibility */}
      <div className="sticky bottom-0 bg-gray-50/70 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 py-4 border-t border-gray-200">
        <div className="flex justify-between max-w-2xl mx-auto">
          <Button
            variant="flat"
            onPress={goToPreviousStep}
            startContent={<span>←</span>}
          >
            Volver
          </Button>

          <div className="flex space-x-3">
            <Button variant="bordered" onPress={handleSkip}>
              Saltar por ahora
            </Button>
            <Button
              color="primary"
              onPress={handleContinue}
              isLoading={saving}
              startContent={!saving ? <span>🎨</span> : undefined}
            >
              {saving ? "Aplicando tema..." : "Continuar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto"
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          💡 Sobre los temas
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Los temas se aplican a toda tu organización</li>
          <li>• Puedes cambiar el tema cuando quieras desde Configuración</li>
          <li>• Los temas oscuros son ideales para trabajo nocturno</li>
        </ul>
      </motion.div>
    </div>
  );
}
