import type { NextConfig } from "next";

function serverActionAllowedOrigins(): string[] {
  const extra =
    process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const hosts = new Set<string>([
    "localhost:3000",
    "milestone-red.vercel.app",
    "milestone-darrins-projects-5d4fb02f.vercel.app",
    ...extra,
  ]);

  for (const raw of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (!raw?.trim()) continue;
    hosts.add(raw.replace(/^https?:\/\//, ""));
  }

  for (const envVar of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    const site = envVar?.trim();
    if (site) {
      try {
        hosts.add(new URL(site).host);
      } catch {
        // ignore invalid URL
      }
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: serverActionAllowedOrigins(),
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
