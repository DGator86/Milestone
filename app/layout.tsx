import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Milestone – Track the path. Kill the next step.",
  description: "A no-bullshit goal CRM that tracks goals as milestone paths.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Milestone" },
};

export const viewport: Viewport = {
  themeColor: "#07111F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-milestone-bg text-gray-900 antialiased">{children}</body>
    </html>
  );
}
