import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// FastAPI backend origin used by the dev-mode proxy.
// Override with MH2_BACKEND_URL env var if the backend runs on a different host/port.
const BACKEND_ORIGIN = process.env.MH2_BACKEND_URL ?? "http://127.0.0.1:8000";

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

  // Dev-mode proxy: forward /api/v1/* to the FastAPI backend.
  // This is only active when running `next dev` (not in static export builds).
  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
