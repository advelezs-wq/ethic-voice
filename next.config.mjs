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
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizeCss: true,
  },
  // Raíz explícita por si usas `bun run dev:turbo` (Turbopack puede fallar con
  // ciertas rutas, p. ej. volúmenes con espacios; el dev por defecto usa Webpack).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
