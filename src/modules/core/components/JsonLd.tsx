import Script from "next/script";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function JsonLd() {
  // Only render in production and when HOTJAR_ID is present
  const id = process.env.NEXT_PUBLIC_HOTJAR_ID;
  if (!id || process.env.NODE_ENV !== "production") {
    return null;
  }

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EthicVoice",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}?s={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      // Avoid beforeInteractive outside of _document per Next.js warning
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLdData),
      }}
    />
  );
}
