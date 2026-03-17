"use client";

import { ReactNode } from "react";
import { Header } from "@/modules/app/components/layout/Header";
import { useEffect } from "react";
import { addToast } from "@/modules/core/utils/safe-toast";

async function fetchStatus() {
  try {
    const res = await fetch("/api/users/org-status", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  useEffect(() => {
    (async () => {
      const data = await fetchStatus();
      if (!data) return;
      // Show toast for cancelled subscriptions only within last 31 days of cycle
      if (data?.cancellation?.isCancelled && data?.cancellation?.endsAt) {
        const days =
          typeof data.cancellation.daysRemaining === "number"
            ? data.cancellation.daysRemaining
            : null;
        if (days !== null && days <= 31) {
          let color: "primary" | "warning" | "danger" = "primary";
          if (days <= 0) color = "danger";
          else if (days <= 15) color = "warning";

          const pretty = (() => {
            if (days <= 0) return "hoy";
            if (days === 1) return "en 1 día";
            return `en ${days} días`;
          })();

          addToast({
            title: "Cuenta próxima a desactivarse",
            description: `Debido a la cancelación de tu suscripción, tu cuenta será desactivada ${pretty}. Puedes reactivarla adquiriendo un plan.`,
            color,
          });
        }
      }
    })();
  }, []);
  return (
    <div className="flex-1 min-w-0 w-0 transition-all mb-16">
      <Header />

      <div className="overflow-auto w-full h-full max-h-[calc(100vh-102px)] overflow-y-auto p-4 sm:p-6 md:p-8">
        {children}
        {/* <SentryFeedbackWidget /> */}
      </div>
    </div>
  );
}
