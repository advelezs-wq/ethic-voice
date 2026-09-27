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
    <div className="ev-app-shell min-w-0 flex-1">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="ev-content-surface relative px-4 pb-16 pt-6 sm:px-6 md:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
