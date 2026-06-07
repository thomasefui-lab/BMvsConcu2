import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.habitat.fr" },
      { protocol: "https", hostname: "cdn.habitat.fr" },
      { protocol: "https", hostname: "www.baita-home.com" },
      { protocol: "https", hostname: "m2.baita-home.com" },
      { protocol: "https", hostname: "bestmobilier.com" },
      { protocol: "https", hostname: "bobochicparis.com" },
      { protocol: "https", hostname: "cdn.bobochicparis.com" },
      { protocol: "https", hostname: "www.sweeek.fr" },
      { protocol: "https", hostname: "sweeek.twic.pics" },
    ],
  },
};

export default nextConfig;
