import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shake icon libraries so each page only ships the icons it uses.
  // Cuts the client bundle and speeds up initial load on slow networks.
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  // Faster production builds: disable per-build production source maps for
  // the client (server still gets symbolicated stack traces via Next default).
  productionBrowserSourceMaps: false,
};

export default nextConfig;
