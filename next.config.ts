import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable linting and type checking during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
