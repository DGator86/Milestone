"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createGoal } from "@/app/dashboard/actions";
import type { Group } from "@/lib/types";

export default function CreateGoalForm({ groups }: { groups: Group[] }) {
  const [open, setOpen] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(3);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white border-2 border-dashed border-milestone-line rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-milestone-blue hover:text-milestone-blue transition-colors w-full"
      >
        <Plus size={18} />
        Add new goal
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-milestone-line p-6" id="create-goal">
      <h3 className="text-base font-semibold text-gray-900 mb-5">New Goal</h3>

      <form action={createGoal} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title *</label>
          <input
            name="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milestone-blue"
            placeholder="e.g. Close Cemex deal"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
            <select
              name="group_id"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milestone-blue bg-white"
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="goal_type"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milestone-blue bg-white"
            >
              <option value="concrete">Concrete</option>
              <option value="touches">Touches</option>
              <option value="deadline">Deadline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Importance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importance</label>
            <select
              name="importance"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milestone-blue bg-white"
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              name="due_date"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milestone-blue"
            />
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Milestones * (at least 1)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMilestoneCount((c) => Math.max(1, c - 1))}
                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center"
              >
                −
              </button>
              <span className="text-sm text-gray-500">{milestoneCount}</span>
              <button
                type="button"
                onClick={() => setMilestoneCount((c) => Math.min(6, c + 1))}
                className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: milestoneCount }, (_, i) => (
              <input
                key={i}
                name={`milestone_${i + 1}`}
                required={i === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                placeholder={`Step ${i + 1}${i === 0 ? " *" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-milestone-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
