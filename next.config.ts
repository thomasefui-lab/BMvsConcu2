import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.habitat.fr" },
      { protocol: "https", hostname: "www.baita-home.com" },
      { protocol: "https", hostname: "bestmobilier.com" },
      { protocol: "https", hostname: "bobochicparis.com" },
      { protocol: "https", hostname: "www.sweeek.fr" },
    ],
  },
};

export default nextConfig;
