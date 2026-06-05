"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Bot,
  Workflow,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import type { AppUser } from "@/lib/types";
import { DEFAULT_TERMS, type Terms } from "@/lib/terms";
import { signOutAction } from "@/app/auth-actions";

export default function TopNav({
  user,
  terms = DEFAULT_TERMS,
  companyName = null,
  brandColor = "#1769FF",
}: {
  user: AppUser;
  terms?: Terms;
  companyName?: string | null;
  brandColor?: string;
}) {
  const NAV_ITEMS = [
    { label: "Home", href: "/dashboard" },
    { label: terms.customers, href: "/customers" },
    { label: terms.contacts, href: "/contacts" },
    { label: terms.opportunities, href: "/opportunities" },
    { label: terms.goals, href: "/goals" },
    { label: "Reports", href: "/reports" },
  ];
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const username = user.email?.split("@")[0] ?? "User";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);
  const initial = username[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-milestone-line">
      <div className="flex items-center h-16 px-4 md:px-6 gap-2">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(to bottom right, ${brandColor}, ${brandColor}cc)` }}
          >
            <span className="text-white font-extrabold text-lg leading-none">
              {(companyName ?? "Milestone").charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-bold text-[17px] text-gray-900 tracking-tight hidden sm:block truncate max-w-[200px]">
            {companyName ?? "Milestone CRM"}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  active
                    ? "text-milestone-blue"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute left-3.5 right-3.5 -bottom-[1px] h-0.5 bg-milestone-blue rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Search"
          >
            <Search size={19} />
          </button>
          <Link
            href="/follow-ups"
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </Link>

          {/* Avatar menu */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center shrink-0 ring-1 ring-black/5">
                <span className="text-white text-xs font-bold">{initial}</span>
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden lg:block">
                {displayName}
              </span>
              <ChevronDown size={15} className="text-gray-400 hidden lg:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card-lg border border-milestone-line p-1.5 z-50">
                <div className="px-3 py-2 border-b border-milestone-line mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <Link
                  href="/flows"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Workflow size={15} className="text-gray-400" />
                  Flows
                </Link>
                <Link
                  href="/completed"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle2 size={15} className="text-gray-400" />
                  Completed
                </Link>
                <Link
                  href="/ai"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Bot size={15} className="text-gray-400" />
                  AI Assistant
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings size={15} className="text-gray-400" />
                  Settings
                </Link>
                <form action={signOutAction} className="border-t border-milestone-line mt-1 pt-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-milestone-red rounded-lg hover:bg-milestone-red-dim transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-milestone-line px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  active
                    ? "bg-milestone-blue-dim text-milestone-blue"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
