import type { NextConfig } from "next";

const allowedOrigins = [
  "localhost:3000",
  "milestone-red.vercel.app",
  "milestone-darrins-projects-5d4fb02f.vercel.app",
  ...(process.env.NEXT_PUBLIC_APP_URL
    ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
    : []),
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
