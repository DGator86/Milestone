"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { Group } from "@/lib/types";

interface TopBarProps {
  groups: Group[];
  currentGroup: string;
  currentSort: string;
  currentStatus: string;
}

export default function TopBar({ groups, currentGroup, currentSort, currentStatus }: TopBarProps) {
  const router = useRouter();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    const g = key === "group" ? value : currentGroup;
    const s = key === "sort" ? value : currentSort;
    const st = key === "status" ? value : currentStatus;
    if (g) params.set("group", g);
    if (s && s !== "priority") params.set("sort", s);
    if (st && st !== "active") params.set("status", st);
    const qs = params.toString();
    router.push(`/dashboard${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-milestone-line px-6 py-3.5 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Track your goals and momentum</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-gray-50 border border-milestone-line rounded-lg overflow-hidden text-sm divide-x divide-milestone-line">
          <label className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Group</span>
            <select
              value={currentGroup}
              onChange={(e) => update("group", e.target.value)}
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
          <label className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Sort</span>
            <select
              value={currentSort}
              onChange={(e) => update("sort", e.target.value)}
              className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs"
            >
              <option value="priority">Priority</option>
              <option value="due_date">Due Date</option>
              <option value="progress">Progress</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Status</span>
            <select
              value={currentStatus}
              onChange={(e) => update("status", e.target.value)}
              className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs"
            >
              <option value="active">Active</option>
              <option value="all">All</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>

        <Link
          href="#create-goal"
          className="flex items-center gap-1.5 bg-milestone-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Goal
        </Link>
      </div>
    </div>
  );
}
