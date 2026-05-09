import Link from "next/link";
import { Plus } from "lucide-react";
import type { Group } from "@/lib/types";

export default function TopBar({ groups }: { groups: Group[] }) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-milestone-line px-6 py-3.5 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Track your goals and momentum</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Grouped controls bar */}
        <div className="flex items-center bg-gray-50 border border-milestone-line rounded-lg overflow-hidden text-sm divide-x divide-milestone-line">
          <label className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Group</span>
            <select className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs">
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
            <select className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs">
              <option>Priority</option>
              <option>Due Date</option>
              <option>Progress</option>
              <option>Name</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-gray-400 text-xs font-medium">Status</span>
            <select className="text-gray-700 font-semibold bg-transparent appearance-none cursor-pointer focus:outline-none text-xs">
              <option>Active</option>
              <option>All</option>
              <option>Completed</option>
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
