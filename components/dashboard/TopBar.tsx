import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import type { Group } from "@/lib/types";

export default function TopBar({ groups }: { groups: Group[] }) {
  return (
    <div className="sticky top-0 z-10 bg-milestone-bg border-b border-milestone-line px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Grouping:</span>
          <div className="flex items-center gap-1.5 bg-white border border-milestone-line rounded-lg px-3 py-1.5 text-sm">
            <Briefcase size={14} className="text-milestone-blue" />
            <span className="font-medium">Work</span>
            <span className="text-gray-400 ml-1">▾</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort:</span>
          <div className="flex items-center gap-1 bg-white border border-milestone-line rounded-lg px-3 py-1.5 text-sm">
            <span className="font-medium">Priority</span>
            <span className="text-gray-400 ml-1">▾</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <div className="flex items-center gap-1 bg-white border border-milestone-line rounded-lg px-3 py-1.5 text-sm">
            <span className="font-medium">Active</span>
            <span className="text-gray-400 ml-1">▾</span>
          </div>
        </div>

        <Link
          href="#create-goal"
          className="flex items-center gap-1.5 bg-milestone-blue text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Goal
        </Link>
      </div>
    </div>
  );
}
