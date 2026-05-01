"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Crosshair,
  Clock,
  Target,
  Users,
  FileText,
  Bot,
  Settings,
  ChevronLeft,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Kill List", href: "/kill-list", icon: Crosshair },
  { label: "Timeline", href: "/timeline", icon: Clock },
  { label: "Goals", href: "/goals", icon: Target },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "AI Assistant", href: "/ai", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-[200px] min-h-screen bg-milestone-sidebar flex flex-col shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-milestone-blue flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <span className="text-white font-semibold text-base">Milestone</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-milestone-blue text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-milestone-blue/30 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold uppercase">
              {user.email?.[0] ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user.email?.split("@")[0] ?? "User"}
            </p>
            <p className="text-gray-500 text-xs">Pro Plan</p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs mt-3 transition-colors">
          <ChevronLeft size={12} />
          Collapse
        </button>
      </div>
    </aside>
  );
}
