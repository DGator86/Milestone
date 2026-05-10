"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Bell, UserCheck, Settings } from "lucide-react";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Follow-ups", href: "/follow-ups", icon: Bell },
  { label: "Lists", href: "/groups", icon: UserCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 md:hidden bg-white border-t border-milestone-line z-30">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
                active ? "text-milestone-blue" : "text-gray-400"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${active ? "text-milestone-blue" : "text-gray-400"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
