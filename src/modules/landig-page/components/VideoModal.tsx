"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal, ModalContent, ModalBody, cn } from "@heroui/react";
import { motion } from "framer-motion";

interface VideoModalProps {
  videoSrc: string;
  posterSrc?: string;
  /** Clases extra para el contenedor de vista previa (p. ej. sombra del hero) */
  className?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  videoSrc,
  posterSrc,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Auto-play when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
    }
  }, [isOpen]);

  return (
    <>
      {/* Video Preview with Play Button */}
      <motion.div
        className={cn(
          "relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl cursor-pointer group",
          className
        )}
        onClick={handleOpen}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Video Preview */}
        <video
          className="w-full h-full object-cover"
          poster={posterSrc}
          muted
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Overlay + play: flex center en el overlay; anillo ping mismo tamaño que el botón */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent">
          <motion.div
            className="relative h-20 w-20 shrink-0"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <span
              className="absolute inset-0 rounded-full bg-lime-400/30 animate-ping"
              aria-hidden
            />
            <span className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-[#0a1f14] shadow-2xl">
              <i
                className="icon-[lucide--play] h-9 w-9 text-white"
                role="img"
                aria-hidden="true"
              />
            </span>
          </motion.div>
        </div>

        {/* Capa de tinte al hover: no intercepta puntero para que el play reciba hover/click */}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[#0a1f14]/0 transition-colors duration-300 group-hover:bg-[#0a1f14]/10" />

        {/* CTA compacto — contraste alto sobre el póster del vídeo */}
        <div className="absolute bottom-3 left-3 right-3 z-[3] sm:bottom-4 sm:left-4 sm:right-4">
          <div className="mx-auto max-w-sm rounded-lg border border-lime-400/25 bg-[#0a1f14]/92 px-3 py-2 shadow-lg shadow-black/30 backdrop-blur-sm sm:max-w-md sm:rounded-xl sm:px-4 sm:py-2.5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold leading-snug text-white sm:text-sm">
                  Ver demostración de la plataforma
                </h3>
                <p className="mt-0.5 text-[11px] font-medium leading-snug text-lime-100/95 sm:text-xs">
                  Conoce cómo funciona EthicVoice
                </p>
              </div>
              <i
                className="icon-[mdi--play-circle] shrink-0 text-lime-400 size-6 drop-shadow-[0_0_6px_rgba(190,242,100,0.45)] sm:size-7"
                role="img"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="5xl"
        backdrop="blur"
        classNames={{
          base: "bg-transparent",
          backdrop: "bg-black/80",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className="p-0">
              <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors flex items-center justify-center group"
                  aria-label="Cerrar video"
                >
                  <i
                    className="icon-[mdi--close] text-white size-6 group-hover:rotate-90 transition-transform"
                    role="img"
                    aria-hidden="true"
                  />
                </button>

                {/* Video Player */}
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  controls
                  controlsList="nodownload"
                  playsInline
                >
                  <source src={videoSrc} type="video/mp4" />
                  Tu navegador no soporta la reproducción de video.
                </video>
              </div>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
