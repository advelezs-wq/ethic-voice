"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal, ModalContent, ModalBody } from "@heroui/react";
import { motion } from "framer-motion";

interface VideoModalProps {
  videoSrc: string;
  posterSrc?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  videoSrc,
  posterSrc,
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
        className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
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

        {/* Overlay with Play Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
          {/* Play Button */}
          <motion.div
            className="relative"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />

            {/* Button background */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-2xl">
              {/* Play Icon */}
              <i
                className="icon-[mdi--play] text-white size-10 ml-1"
                role="img"
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/10 transition-colors duration-300" />

        {/* "Ver Demo" Text */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ver demostración de la plataforma
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Conoce cómo funciona EthicVoice
                </p>
              </div>
              <i
                className="icon-[mdi--play-circle] text-green-600 size-8"
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
