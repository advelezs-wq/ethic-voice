"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@heroui/react";

const CHAR_DELAY_MS = 30;
const INITIAL_DELAY_MS = 200;
const TRANSITION_MS = 500;

type AnimatedHeadingProps = {
  /** Texto con saltos de línea literales `\n` */
  text: string;
  className?: string;
};

/** Partes de una línea: palabra o bloque de espacios (permiten salto entre palabras). */
function lineParts(line: string): { kind: "word" | "spaces"; value: string }[] {
  const raw = line.split(/(\s+)/).filter((p) => p.length > 0);
  return raw.map((value) =>
    /^\s+$/.test(value)
      ? { kind: "spaces" as const, value }
      : { kind: "word" as const, value }
  );
}

/**
 * Animación carácter a carácter dentro de cada palabra; las palabras enteras
 * van en `whitespace-nowrap` para que el wrap responsive no parta letras.
 */
export function AnimatedHeading({ text, className }: AnimatedHeadingProps) {
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);

  const lines = useMemo(() => text.split("\n"), [text]);

  useEffect(() => {
    if (reduce) {
      setArmed(true);
      return;
    }
    const id = window.setTimeout(() => setArmed(true), INITIAL_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [reduce]);

  return (
    <h1
      className={cn(
        "text-balance text-4xl font-normal text-white md:text-5xl lg:text-6xl xl:text-7xl mb-4 break-normal [overflow-wrap:normal] [word-break:normal]",
        className
      )}
      style={{ letterSpacing: "-0.04em" }}
    >
      {lines.map((line, lineIndex) => {
        const lineLen = line.length;
        let charIndexInLine = 0;
        const parts = lineParts(line);

        return (
          <span key={lineIndex} className="block">
            {parts.map((part, partIndex) => {
              if (part.kind === "spaces") {
                const start = charIndexInLine;
                charIndexInLine += part.value.length;
                const delay =
                  INITIAL_DELAY_MS +
                  lineIndex * lineLen * CHAR_DELAY_MS +
                  start * CHAR_DELAY_MS;
                const visible = reduce || armed;
                return (
                  <span
                    key={`${lineIndex}-sp-${partIndex}`}
                    className="inline whitespace-normal transition-[opacity,transform]"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateX(0)" : "translateX(-18px)",
                      transitionDuration: reduce ? "0ms" : `${TRANSITION_MS}ms`,
                      transitionDelay: reduce ? "0ms" : `${delay}ms`,
                      transitionTimingFunction:
                        "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    {part.value}
                  </span>
                );
              }

              return (
                <span
                  key={`${lineIndex}-w-${partIndex}`}
                  className="inline-block whitespace-nowrap align-baseline"
                >
                  {Array.from(part.value).map((ch, ci) => {
                    const charIndex = charIndexInLine++;
                    const delay =
                      INITIAL_DELAY_MS +
                      lineIndex * lineLen * CHAR_DELAY_MS +
                      charIndex * CHAR_DELAY_MS;
                    const visible = reduce || armed;
                    return (
                      <span
                        key={ci}
                        className="inline-block transition-[opacity,transform]"
                        style={{
                          opacity: visible ? 1 : 0,
                          transform: visible
                            ? "translateX(0)"
                            : "translateX(-18px)",
                          transitionDuration: reduce
                            ? "0ms"
                            : `${TRANSITION_MS}ms`,
                          transitionDelay: reduce ? "0ms" : `${delay}ms`,
                          transitionTimingFunction:
                            "cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
}
