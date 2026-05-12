import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientProvider } from "@/modules/core/providers/ClientProvider";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import "./globals.css";
import { JsonLd } from "@/modules/core/components/JsonLd";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const OPEN_GRAPH_IMAGE_URL = `${BASE_URL}/brand/ethicvoice.jpeg`;
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "EthicVoice | Inicio",
  description:
    "EthicVoice convierte la gestión de denuncias éticas en una ventaja competitiva: plataforma integral de línea ética para empresas que fomenta la transparencia, optimiza flujos de trabajo y protege tu reputación.",
  keywords: [
    "línea ética",
    "denuncia ética",
    "whistleblowing",
    "cumplimiento corporativo",
    "cultura de integridad",
    "gestión de casos",
    "plataforma ética",
    "ISO 27001",
    "cumplimiento normativo",
    "seguridad de datos",
    "IA para cumplimiento",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "EthicVoice",
    title: "EthicVoice | Inicio",
    description:
      "EthicVoice convierte la gestión de denuncias éticas en una ventaja competitiva: plataforma integral de línea ética para empresas que fomenta la transparencia, optimiza flujos de trabajo y protege tu reputación.",
    url: BASE_URL,
    images: [
      {
        url: OPEN_GRAPH_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "EthicVoice | Plataforma de Línea Ética",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EthicVoice | Inicio",
    description:
      "EthicVoice convierte la gestión de denuncias éticas en una ventaja competitiva: plataforma integral de línea ética para empresas que fomenta la transparencia, optimiza flujos de trabajo y protege tu reputación.",
    images: [OPEN_GRAPH_IMAGE_URL],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let serverUser = null;
  const serverToken = "";

  try {
    const { userId: clerkId } = await auth();
    const clerkUser = await currentUser();

    if (clerkId && clerkUser) {
      serverUser = await prisma.user.upsert({
        where: { email: clerkUser.emailAddresses[0].emailAddress },
        create: {
          id: clerkId,
          email: clerkUser.emailAddresses[0].emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        },
        update: {
          id: clerkId,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        },
        include: {
          organizations: true,
        },
      });
    }
  } catch (error) {
    // Auth not available for public routes, continue without user
    console.log("Auth not available for this route:", error);
  }

  return (
    <html lang="en">
      <head>
        <JsonLd />
        <Script
          src="https://sdk.rebill.com/v3/rebill.js"
          strategy="beforeInteractive"
        />
        {/* Píxeles GA / Clarity / Meta: solo tras consentimiento (ConsentGatedScripts) */}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientProvider serverUser={serverUser} serverToken={serverToken}>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
