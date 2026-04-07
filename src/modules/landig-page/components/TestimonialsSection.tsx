"use client";

import React, { useState } from "react";

const TESTIMONIALS = [
  {
    name: "Cliente A - CEO",
    quote: '"EthicVoice ha transformado nuestra cultura ética."',
    img: "/platform/testimonial-1.jpg",
    bg: "bg-gray-200",
  },
  {
    name: "Cliente B - Compliance Officer",
    quote: '"La herramienta más completa para gestionar riesgos."',
    img: "/platform/testimonial-2.jpg",
    bg: "bg-gray-300",
  },
  {
    name: "Cliente C - HR Director",
    quote: '"Hemos mejorado la retención y el clima laboral."',
    img: "/platform/testimonial-3.jpg",
    bg: "bg-gray-200",
  },
];

export const TestimonialsSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section className="bg-white py-14 px-5">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">
          Lo dicen nuestros clientes
        </h2>

        {/* Video / main testimonial */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video mb-5 shadow-xl group cursor-pointer">
          {/* Decorative wave lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 800 450"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 225 Q200 100 400 225 T800 225" stroke="white" strokeWidth="1" fill="none" />
            <path d="M0 275 Q200 150 400 275 T800 275" stroke="white" strokeWidth="1" fill="none" />
            <path d="M0 175 Q200 50 400 175 T800 175" stroke="white" strokeWidth="1" fill="none" />
          </svg>

          {/* Background image */}
          <div className={`absolute inset-0 ${TESTIMONIALS[activeIdx].bg}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TESTIMONIALS[activeIdx].img}
              alt={TESTIMONIALS[activeIdx].name}
              className="w-full h-full object-cover opacity-60"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          {/* Play button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
              <i className="icon-[lucide--play] w-7 h-7 text-green-800 ml-1" />
            </div>
            <div className="text-center px-6">
              <p className="text-white font-semibold">{TESTIMONIALS[activeIdx].name}</p>
              <p className="text-white/80 text-sm mt-1 italic">{TESTIMONIALS[activeIdx].quote}</p>
            </div>
          </div>

          {/* Video controls bar mock */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2 flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/20 rounded-full">
              <div className="h-full w-0 bg-white rounded-full" />
            </div>
            <i className="icon-[lucide--volume-2] w-4 h-4 text-white/70" />
            <i className="icon-[lucide--maximize-2] w-4 h-4 text-white/70" />
          </div>
        </div>

        {/* Thumbnail row */}
        <div className="grid grid-cols-3 gap-3">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setActiveIdx(i)}
              className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
                activeIdx === i ? "border-green-700 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <div className={`relative aspect-video ${t.bg}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <i className="icon-[lucide--play] w-5 h-5 text-white" />
                </div>
              </div>
              <div className="bg-white p-2">
                <p className="text-xs font-semibold text-gray-800 leading-tight">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 italic">{t.quote}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
