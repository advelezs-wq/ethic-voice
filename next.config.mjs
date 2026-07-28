import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/eventos", destination: "/blog", permanent: true },
      { source: "/noticias", destination: "/blog", permanent: true },
      // Legacy non-locale Semsei blog URLs (indexed before the /[locale]/blogs
      // routing + preflight verification was introduced). Redirect to the
      // canonical es-locale route instead of letting the orphaned
      // src/app/blogs/[...slug]/page.tsx render (it bypasses the middleware
      // preflight and silently breaks — see src/app/[locale]/blogs).
      { source: "/blogs/:path*", destination: "/es/blogs/:path*", permanent: true },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizeCss: true,
  },
  // Next's default htmlLimitedBots regex doesn't match plain "Googlebot" (only
  // Google-prefixed/suffixed variants like AdsBot-Google), so routes with dynamic
  // generateMetadata (e.g. /blogs/[...slug], which reads headers()) stream their
  // <title>/meta tags in via client JS instead of embedding them in the initial
  // <head>. Googlebot's indexer doesn't pick that up, showing "Untitled" in search
  // results even though the body content is indexed correctly. Force blocking
  // metadata for every request so <head> is always complete in the first response.
  htmlLimitedBots: /.*/,
  // Raíz explícita por si usas `bun run dev:turbo` (Turbopack puede fallar con
  // ciertas rutas, p. ej. volúmenes con espacios; el dev por defecto usa Webpack).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
