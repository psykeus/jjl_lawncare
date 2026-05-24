import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
