"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { OnboardingContextType } from "../OnboardingClient";

interface WelcomeStepProps {
  context: OnboardingContextType;
}

export function WelcomeStep({ context }: WelcomeStepProps) {
  const { goToNextStep } = context;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-6"
    >
      {/* Hero Section */}
      <div className="mb-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <span className="text-3xl">🎉</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Estamos emocionados de tenerte como parte de nuestra comunidad
          </p>
        </motion.div>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto"
      >
        <p className="text-gray-700 leading-relaxed mb-4">
          Has dado el primer paso hacia una experiencia increíble. Ahora vamos a
          configurar tu experiencia personalizada antes de crear tu organización
          y acceder a todas las funcionalidades de la plataforma.
        </p>
        <p className="text-gray-600 text-sm">
          Tu inversión en nuestra plataforma nos motiva a seguir innovando y
          ofrecerte las mejores herramientas para hacer crecer tu negocio.
        </p>
      </motion.div>

      {/* Next Steps Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-6 max-w-2xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿Qué configuraremos?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              🎨
            </div>
            <p className="font-medium text-gray-900">Personalización</p>
            <p className="text-gray-600">Tema y estilo</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              🔔
            </div>
            <p className="font-medium text-gray-900">Notificaciones</p>
            <p className="text-gray-600">Tus preferencias</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              🏢
            </div>
            <p className="font-medium text-gray-900">Tu organización</p>
            <p className="text-gray-600">Crear tu espacio</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Al final crearás tu organización y accederás a la plataforma completa
        </div>
      </motion.div>

      {/* Action Button (kept visible without scrolling) */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t border-gray-200 pt-4">
        <Button
          color="primary"
          size="lg"
          onPress={goToNextStep}
          className="px-8 py-3 font-semibold"
        >
          Comenzar configuración →
        </Button>
      </div>
    </motion.div>
  );
}
