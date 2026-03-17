"use client";

import React from "react";

type CalendlyCtaProps = {
  className?: string;
  children?: React.ReactNode;
};

export const CalendlyCta: React.FC<CalendlyCtaProps> = ({ className, children }) => {
  const calendlyUrl =
    "https://calendly.com/ethicvoice-info/30min?hide_event_type_details=1&hide_gdpr_banner=1";

  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    try {
      if (typeof window !== "undefined" && (window as any).Calendly) {
        (window as any).Calendly.initPopupWidget({ url: calendlyUrl });
        return;
      }
    } catch {}
    if (typeof window !== "undefined") {
      window.open(calendlyUrl, "_blank");
    }
  };

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
};


