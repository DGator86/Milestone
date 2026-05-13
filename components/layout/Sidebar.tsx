"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  UserCheck,
  TrendingUp,
  Users,
  FileText,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bell,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useMobileSidebar } from "@/lib/sidebar-context";

const navSections = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Follow-ups", href: "/follow-ups", icon: Bell },
      { label: "Pipeline", href: "/pipeline", icon: TrendingUp },
      { label: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    label: "Organize",
    items: [
      { label: "Lists", href: "/groups", icon: UserCheck },
      { label: "Templates", href: "/templates", icon: FileText },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "AI Assistant", href: "/ai", icon: Bot },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, closeMobile } = useMobileSidebar();

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const username = user.email?.split("@")[0] ?? "User";
  const initial = username[0].toUpperCase();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={[
          "fixed md:static inset-y-0 left-0 z-50",
          "w-[220px]",
          collapsed ? "md:w-[60px]" : "md:w-[220px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "min-h-screen bg-milestone-sidebar flex flex-col shrink-0",
          "transition-[width,transform] duration-200 ease-in-out overflow-hidden",
        ].join(" ")}
      >
        {/* Brand */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.08] ${
            collapsed ? "md:justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <div className={`min-w-0 ${collapsed ? "md:hidden" : ""}`}>
            <p className="text-white font-bold text-[15px] tracking-tight leading-none">
              Milestone
            </p>
            <p className="text-white/30 text-[10px] mt-0.5">Goal CRM</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.label}
              className={sectionIdx > 0 ? "mt-1 pt-1 border-t border-white/[0.05]" : ""}
            >
              <p
                className={`text-white/25 text-[10px] font-semibold tracking-widest uppercase px-4 pt-2 pb-1 ${
                  collapsed ? "md:hidden" : ""
                }`}
              >
                {section.label}
              </p>
              <div className="px-2 space-y-0.5">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active =
                    pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={[
                        "relative flex items-center rounded-lg text-sm font-medium",
                        "transition-all duration-150 group",
                        collapsed ? "md:justify-center md:py-2.5 md:px-0 gap-3 px-3 py-2.5" : "gap-3 px-3 py-2.5",
                        active
                          ? "bg-white/[0.1] text-white"
                          : "text-white/50 hover:text-white/90 hover:bg-white/[0.07]",
                      ].join(" ")}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-milestone-blue rounded-r-full" />
                      )}
                      <Icon
                        size={17}
                        className={
                          active
                            ? "text-white shrink-0"
                            : "text-white/50 group-hover:text-white/80 shrink-0"
                        }
                      />
                      <span className={collapsed ? "md:hidden" : ""}>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="border-t border-white/[0.08] p-3 space-y-2.5">
          <div
            className={`flex items-center gap-2.5 ${
              collapsed ? "md:justify-center" : "px-1"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/50 to-milestone-blue/60 flex items-center justify-center shrink-0 ring-1 ring-white/10">
              <span className="text-white text-xs font-bold">{initial}</span>
            </div>
            <div className={`flex-1 min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <p className="text-white text-[13px] font-semibold truncate">{username}</p>
              <p className="text-white/30 text-[10px]">Pro Plan</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`hidden md:flex items-center gap-1.5 text-white/25 hover:text-white/60 text-xs transition-colors w-full ${
              collapsed ? "justify-center" : "px-1"
            }`}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
