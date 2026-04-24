"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@heroui/react";
import { useClerk } from "@clerk/nextjs";
import { OnboardingContextType, OnboardingStep } from "./OnboardingClient";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  context: OnboardingContextType;
  progress: number;
}

interface StepInfo {
  step: OnboardingStep;
  title: string;
  description: string;
  icon: string;
}

export function OnboardingLayout({
  children,
  context,
  progress,
}: OnboardingLayoutProps) {
  const { currentStep } = context;
  const { signOut } = useClerk();
  const handleSupportClick = () => {
    const subject = encodeURIComponent("Solicitud de Asistencia Técnica");
    const body = encodeURIComponent(
      "Estimado equipo de soporte,\n\nMe gustaría solicitar asistencia técnica para la plataforma EthicVoice.\n\nDescripción del problema o solicitud:\n-\n\nDatos de contacto:\nNombre: \nEmpresa/Organización: \nTeléfono: \n\nGracias."
    );
    window.location.href = `mailto:soporte@ethicvoice.co?subject=${subject}&body=${body}`;
  };

  // Build steps dynamically based on availableSteps from context
  const steps: StepInfo[] = context.availableSteps.map((s) => {
    switch (s) {
      case OnboardingStep.WELCOME:
        return {
          step: s,
          title: "Bienvenida",
          description: "Gracias por elegirnos",
          icon: "✅",
        };
      case OnboardingStep.THEME_SELECTION:
        return {
          step: s,
          title: "Personalización",
          description: "Ajusta tu experiencia",
          icon: "🎨",
        };
      case OnboardingStep.NOTIFICATIONS:
        return {
          step: s,
          title: "Notificaciones",
          description: "Configura tus preferencias",
          icon: "🔔",
        };
      case OnboardingStep.CREATE_ORGANIZATION:
        return {
          step: s,
          title: "Crear organización",
          description: "Finalizar configuración",
          icon: "🏢",
        };
      default:
        return {
          step: s,
          title: "Paso",
          description: "",
          icon: "•",
        };
    }
  });

  const getStepStatus = (step: OnboardingStep) => {
    const currentIndex = steps.findIndex((s) => s.step === currentStep);
    const stepIndex = steps.findIndex((s) => s.step === step);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const handleLogout = () => {
    if (
      confirm(
        "¿Estás seguro que quieres cerrar sesión? Se perderá todo el progreso de configuración y tendrás que comenzar nuevamente."
      )
    ) {
      signOut({ redirectUrl: "/" });
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-[18rem_1fr] overflow-hidden">
      {/* Left Sidebar - Fixed full height */}
      <div className="h-screen w-72 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex min-w-0 flex-col gap-1">
            <Image
              src="/brand/logo-nobg.png"
              alt="EthicVoice"
              width={150}
              height={36}
              className="h-9 w-auto max-w-[11rem] object-contain"
              priority
            />
            <p className="text-xs text-gray-500">Configuración inicial</p>
          </Link>

          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={handleLogout}
            className="text-gray-400 hover:text-gray-600"
            title="Cerrar sesión"
          >
            <i className="icon-[lucide--log-out] w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Progreso</span>
            <span className="text-xs font-semibold text-emerald-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 space-y-3 overflow-auto pr-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step.step);
            return (
              <div
                key={step.step}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  status === "current"
                    ? "bg-emerald-50 border border-emerald-200"
                    : status === "completed"
                      ? "bg-gray-50"
                      : "bg-transparent"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                    status === "completed"
                      ? "bg-emerald-500 text-white"
                      : status === "current"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-500"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {status === "completed" ? (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-medium text-sm ${
                      status === "current"
                        ? "text-emerald-700"
                        : status === "completed"
                          ? "text-gray-700"
                          : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      status === "current"
                        ? "text-emerald-600"
                        : status === "completed"
                          ? "text-gray-500"
                          : "text-gray-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1 text-sm">
            ¿Necesitas ayuda?
          </h4>
          <p className="text-xs text-blue-700 mb-2">
            Nuestro equipo está aquí para ayudarte
          </p>
          <Button
            size="sm"
            variant="light"
            onPress={handleSupportClick}
            className="group text-blue-600 hover:text-blue-700 transition-transform hover:translate-x-0.5"
            endContent={
              <i className="icon-[lucide--arrow-right] w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            }
          >
            Contactar soporte
          </Button>
        </div>
      </div>

      {/* Main Content - scrollable area only */}
      <div
        id="onboarding-content"
        className="h-screen overflow-y-auto p-8 bg-gray-50/50"
      >
        <div className="w-full max-w-3xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
