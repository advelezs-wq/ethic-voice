import { Header } from "@/modules/landig-page/components/layout/Header";
import { Metadata } from "next";
import Link from "next/link";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
  title: "EthicVoice | Security",
  description: "EthicVoice website",
};

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-screen flex flex-col ">
      <Header />
      <div className="w-full h-full p-4 md:p-8 lg:p-12 flex flex-col animate-slide-up mt-16 container max-w-6xl mx-auto px-4 py-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group w-fit -mb-16"
        >
          <i
            className="icon-[bx--left-arrow-alt] size-4 group-hover:-translate-x-1 transition-transform"
            role="img"
            aria-hidden="true"
          />
          Volver al inicio
        </Link>
        <div className="my-auto mx-auto w-full flex items-center justify-center animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
