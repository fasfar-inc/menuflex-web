import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // folder-style URLs (/tr/, /demo/liman/) work the same on any static host
  trailingSlash: true,
};

export default nextConfig;
