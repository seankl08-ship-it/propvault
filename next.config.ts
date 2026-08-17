import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large video uploads through middleware and API routes (max 200MB)
  experimental: {
    middlewareClientMaxBodySize: 200 * 1024 * 1024,
  },
};

export default nextConfig;
