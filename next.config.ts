import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable linting and type checking during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
    ],
  },
};

export default nextConfig;
