"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Menu } from "lucide-react";
import { useMobileSidebar } from "@/lib/sidebar-context";
import type { Group } from "@/lib/types";

interface TopBarProps {
  groups: Group[];
  currentGroup: string;
  currentSort: string;
  currentStatus: string;
}

export default function TopBar({
  groups,
  currentGroup,
  currentSort,
  currentStatus,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleMobile } = useMobileSidebar();

  function navigate(key: string, value: string) {
    const next: Record<string, string> = {
      group: currentGroup,
      sort: currentSort,
      status: currentStatus,
      [key]: value,
    };
    const params = new URLSearchParams();
    if (next.group) params.set("group", next.group);
    if (next.sort && next.sort !== "priority") params.set("sort", next.sort);
    if (next.status && next.status !== "active") params.set("status", next.status);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-milestone-line px-4 md:px-6 py-3 flex items-center gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className="md:hidden p-2 -ml-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Track your goals and momentum</p>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center bg-gray-50 border border-milestone-line rounded-lg overflow-hidden text-sm divide-x divide-milestone-line">
          {/* Group filter */}
          <label className="flex items-center gap-1.5 px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Group</span>
            <select
              value={currentGroup}
              onChange={(e) => navigate("group", e.target.value)}
              className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs"
            >
              <option value="">All</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>

          {/* Sort */}
          <label className="flex items-center gap-1.5 px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Sort</span>
            <select
              value={currentSort}
              onChange={(e) => navigate("sort", e.target.value)}
              className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs"
            >
              <option value="priority">Priority</option>
              <option value="due_date">Due Date</option>
              <option value="progress">Progress</option>
              <option value="name">Name</option>
            </select>
          </label>

          {/* Status */}
          <label className="flex items-center gap-1.5 px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Show</span>
            <select
              value={currentStatus}
              onChange={(e) => navigate("status", e.target.value)}
              className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs"
            >
              <option value="active">Active</option>
              <option value="all">All</option>
              <option value="completed">Done</option>
            </select>
          </label>
        </div>

        <Link
          href="#create-goal"
          className="flex items-center gap-1.5 bg-milestone-blue text-white px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200 whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">New Goal</span>
        </Link>
      </div>
    </div>
  );
}
