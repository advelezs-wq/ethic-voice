"use client";

import { useEffect, useRef } from "react";

/**
 * BackgroundCurves renders a lightweight canvas with soft, thin curved lines
 * that subtly change as the user scrolls, creating a non-repetitive pattern.
 * - Very low opacity and small stroke width for a relaxing appearance
 * - Uses blended sines as pseudo-noise; phase advances with scroll
 */
export function BackgroundCurves() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const needsDrawRef = useRef(true);

  const setup = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const parent = canvas.parentElement as HTMLElement | null;
    const w = parent?.clientWidth ?? window.innerWidth;
    const h = parent?.clientHeight ?? window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    needsDrawRef.current = true;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // Clear (transparent) so it overlays softly on the base bg
    ctx.clearRect(0, 0, w, h);

    const lines = 11; // number of bands
    const baseColor = "rgba(239, 232, 222, 0.18)"; // very light
    const altColor = "rgba(247, 242, 234, 0.14)";
    const phase = phaseRef.current;

    for (let i = 0; i < lines; i++) {
      const yBase = (i + 0.5) * (h / lines);
      const randomizer = Math.sin(phase * 0.12 + i * 1.7) * 0.5 + 0.5; // 0..1
      const amp = 10 + i * 1.0 + randomizer * 4; // amplitude per band
      const freq = 1.3 + (i % 3) * 0.33 + randomizer * 0.2; // slight variation
      const freq2 = 3.0 + (i % 5) * 0.16 + (1 - randomizer) * 0.25;
      const color = i % 2 === 0 ? baseColor : altColor;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.35; // thinner lines
      ctx.beginPath();

      const step = Math.max(90, Math.floor(w / 10));
      for (let x = 0; x <= w + step; x += step) {
        const t = x / w;
        const yOffset =
          Math.sin((t * Math.PI * 2 * freq) + phase * 0.65 + i * 0.35) * amp +
          Math.sin((t * Math.PI * 2 * freq2) + phase * 1.1 + i * 0.15) * (amp * 0.4);

        const cx = x + step / 2;
        const ct = cx / w;
        const cyOffset =
          Math.sin((ct * Math.PI * 2 * (freq * 0.9)) + phase * 0.5 + i * 0.22) * (amp * 0.85) +
          Math.cos((ct * Math.PI * 2 * (freq2 * 0.8)) + phase * 0.9 + i * 0.11) * (amp * 0.35);

        const y = yBase + yOffset;
        const cy = yBase + cyOffset;

        if (x === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.quadraticCurveTo(x - step / 2, cy, x, y);
        }
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    setup();

    const onScroll = () => {
      // Advance phase based on scroll position for an infinite non-repeating feel
      phaseRef.current = window.scrollY * 0.008;
      if (!needsDrawRef.current) {
        needsDrawRef.current = true;
      }
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (needsDrawRef.current) {
            needsDrawRef.current = false;
            draw();
          }
        });
      }
    };

    const onResize = () => {
      setup();
      draw();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    draw();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}


