import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
