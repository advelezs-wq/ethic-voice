import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export const FooterCTA = () => {
  // Your Calendly URL with parameters
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
    <section className="py-20 px-6 bg-gradient-to-br from-green-800 via-green-700 to-green-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M0,0 Q50,20 100,0 L100,100 L0,100 Z" fill="url(#gradient)" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            ¿Listo para transformar tu cultura de cumplimiento?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Únete a más de 5,000 organizaciones que han transformado su gestión
            de cumplimiento con nuestra plataforma. Comenzar es más fácil de lo
            que piensas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href=""
              onClick={openCalendlyPopup}
              className="bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center group text-lg"
            >
              <i
                className="icon-[mynaui--calendar] size-5 mr-2"
                role="img"
                aria-hidden="true"
              />
              Solicitar demo
              <i
                className="icon-[mdi--arrow-right] ml-2 size-5 transition-transform group-hover:-rotate-45"
                role="img"
                aria-hidden="true"
              />
            </Link>

            {/* Botón 'Ver cómo funciona' removido por solicitud */}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-green-100"
          >
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              <span className="text-sm">Demo en vivo de 30 minutos</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              <span className="text-sm">Sin compromiso</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              <span className="text-sm">Configuración gratuita</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
