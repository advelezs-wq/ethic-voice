import type { Metadata } from "next";
import { ClientProvider } from "@/modules/core/providers/ClientProvider";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/modules/prisma/lib/prisma";
import "./globals.css";
import { JsonLd } from "@/modules/core/components/JsonLd";
import Script from "next/script";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const OPEN_GRAPH_IMAGE_URL = `${BASE_URL}/brand/ethicvoice.jpeg`;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
    "G2 Líder 2025",
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
        {/* Facebook Pixel */}
        {FB_PIXEL_ID && (
          <>
            <Script id="facebook-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                alt=""
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}
        {/* Microsoft Clarity */}
        {CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}
        {/* Google Analytics 4 */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={` antialiased`} suppressHydrationWarning={true}>
        <ClientProvider serverUser={serverUser} serverToken={serverToken}>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
