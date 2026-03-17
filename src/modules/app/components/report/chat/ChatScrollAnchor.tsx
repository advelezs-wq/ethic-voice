"use client";

import React, { useEffect, useRef } from "react";

interface ChatScrollAnchorProps {
  trackVisibility?: boolean;
}

export function ChatScrollAnchor({
  trackVisibility = true,
}: ChatScrollAnchorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackVisibility || !ref.current) return;

    const observer = new IntersectionObserver(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([entry]) => {
        // You can dispatch an event or update state here
        // to track if the user is at the bottom of the chat
      },
      {
        threshold: 0,
        rootMargin: "0px 0px -10px 0px",
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [trackVisibility]);

  return <div ref={ref} className="h-1 w-full" />;
}
