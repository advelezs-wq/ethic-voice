import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useIsClient } from "@/modules/app/hooks/useIsClient";
import { VideoModal } from "./VideoModal";

// Extend the Window interface to include Calendly
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export const Hero = () => {
  const isClient = useIsClient();

  // Your Calendly URL with parameters
  const calendlyUrl =
    "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

  const openCalendlyPopup = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Only run on client side and check if Calendly is available
    if (isClient && typeof window !== "undefined" && window.Calendly) {
      window.Calendly.initPopupWidget({
        url: calendlyUrl,
      });
    } else {
      // Fallback: open in new tab if Calendly isn't loaded yet
      window.open(calendlyUrl, "_blank");
    }
  };

  return (
    <section className="relative py-20 md:px-6 bg-gradient-to-br from-white via-gray-50 to-green-50/30 overflow-hidden">
      <div className="container md:mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gray-900">Transformamos</span>{" "}
                <span className="text-gray-900">la Ética</span>{" "}
                <span className="text-gray-900">en</span>{" "}
                <span className="text-[#98D24C]">Acción</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                Ponemos a los equipos de cumplimiento en el centro con
                tecnología que convierte el cumplimiento en una ventaja
                proactiva: fomentando una cultura de integridad, optimizando
                flujos de trabajo y reduciendo el riesgo organizacional.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href=""
                onClick={openCalendlyPopup}
                className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 group transition-colors flex items-center cursor-pointer"
              >
                Solicitar demo
                <i
                  className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
                  role="img"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>

          {/* Right Content - Video Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <VideoModal
              videoSrc="/demo-video.mp4"
              posterSrc="/platform/ethicvoice-hero.jpeg"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
