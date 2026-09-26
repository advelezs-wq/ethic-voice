import { AuthPageChrome } from "@/modules/landig-page/components/AuthPageChrome";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Acceso | EthicVoice",
  description: "Inicia sesión o crea tu cuenta en EthicVoice.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthPageChrome>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        {children}
      </div>
    </AuthPageChrome>
  );
}
