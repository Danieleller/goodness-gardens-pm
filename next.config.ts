import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s46ugccfpalsuqkp.public.blob.vercel-storage.com",
        pathname: "/logos/**",
      },
    ],
  },
};

export default nextConfig;
