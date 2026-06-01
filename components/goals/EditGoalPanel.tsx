"use client";

import { useState, useTransition } from "react";
import { Pencil, ChevronDown, X } from "lucide-react";
import { updateGoal } from "@/app/goals/actions";
import type { GoalWithDetails, Group } from "@/lib/types";

export default function EditGoalPanel({
  goal,
  groups,
}: {
  goal: GoalWithDetails;
  groups: Group[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Pencil size={12} />
        Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-card-lg border border-milestone-line w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-milestone-line">
          <h2 className="text-sm font-bold text-gray-900">Edit Goal</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form
          action={async (fd) => {
            startTransition(async () => {
              await updateGoal(goal.id, null, fd);
              setOpen(false);
            });
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              name="title"
              defaultValue={goal.title}
              required
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Group
              </label>
              <div className="relative">
                <select
                  name="group_id"
                  defaultValue={goal.group_id}
                  className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Type
              </label>
              <div className="relative">
                <select
                  name="goal_type"
                  defaultValue={goal.goal_type}
                  className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                >
                  <option value="concrete">Concrete</option>
                  <option value="touches">Touches</option>
                  <option value="deadline">Deadline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Importance
              </label>
              <div className="relative">
                <select
                  name="importance"
                  defaultValue={goal.importance}
                  className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-milestone-blue"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="critical">Critical</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Due Date
              </label>
              <input
                name="due_date"
                type="date"
                defaultValue={goal.due_date ?? ""}
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="bg-milestone-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
