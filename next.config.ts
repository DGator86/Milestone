import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "milestone-red.vercel.app",
        "milestone-darrins-projects-5d4fb02f.vercel.app",
      ],
    },
  },
};

export default nextConfig;
