import type { NextConfig } from "next";

function serverActionAllowedOrigins(): string[] {
  const extra =
    process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const hosts = new Set<string>(["localhost:3000", ...extra]);

  for (const raw of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (!raw?.trim()) continue;
    hosts.add(raw.replace(/^https?:\/\//, ""));
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      hosts.add(new URL(site).host);
    } catch {
      // ignore invalid NEXT_PUBLIC_SITE_URL
    }
  }

  return [...hosts];
}
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
      allowedOrigins: serverActionAllowedOrigins(),
      allowedOrigins,
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
