import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export so Electron can load files directly in production.
  // In dev mode (electron:dev script) Electron loads from http://localhost:3000.
  output: isProd ? "export" : undefined,

  // Static export requires no image optimisation server
  images: {
    unoptimized: true,
  },

  // Electron loads from file:// so relative asset paths are required
  assetPrefix: isProd ? "./" : undefined,

  // Disable the x-powered-by header (cosmetic)
  poweredByHeader: false,
};

export default nextConfig;
