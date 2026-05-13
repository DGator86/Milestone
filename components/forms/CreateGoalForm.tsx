"use client";

import { useState } from "react";
import { Plus, Target, ChevronDown } from "lucide-react";
import { createGoal } from "@/app/dashboard/actions";
import type { Group } from "@/lib/types";
import type { GoalTemplate } from "@/lib/templates";

const IMPORTANCE_OPTIONS = [
  { value: "normal", label: "Normal", color: "bg-gray-400", textColor: "text-gray-600" },
  { value: "important", label: "Important", color: "bg-milestone-amber", textColor: "text-amber-700" },
  { value: "critical", label: "Critical", color: "bg-milestone-red", textColor: "text-red-700" },
] as const;

export default function CreateGoalForm({
  groups,
  template,
}: {
  groups: Group[];
  template?: GoalTemplate | null;
}) {
  const [open, setOpen] = useState(!!template);
  const [milestoneCount, setMilestoneCount] = useState(template?.milestones.length ?? 3);
  const [milestoneValues, setMilestoneValues] = useState<string[]>(
    template?.milestones ?? Array(3).fill("")
  );
  const [importance, setImportance] = useState<"normal" | "important" | "critical">(
    template?.importance ?? "normal"
  );

  function adjustCount(newCount: number) {
    const clamped = Math.max(1, Math.min(6, newCount));
    setMilestoneCount(clamped);
    setMilestoneValues((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array(clamped - prev.length).fill("")];
      }
      return prev.slice(0, clamped);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 bg-white border-2 border-dashed border-milestone-line rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-milestone-blue hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all w-full group"
      >
        <div className="w-7 h-7 rounded-lg border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue group-hover:border-milestone-blue group-hover:text-white transition-all">
          <Plus size={15} />
        </div>
        <span className="font-medium">Add new goal</span>
      </button>
    );
  }

  return (
    <div
      className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden animate-fade-up"
      id="create-goal"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-milestone-line bg-gray-50/60">
        <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center">
          {template ? (
            <span className="text-lg leading-none">{template.icon}</span>
          ) : (
            <Target size={16} className="text-milestone-blue" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            {template ? template.title : "New Goal"}
          </h3>
          <p className="text-xs text-gray-400">
            {template ? template.description : "Define your goal and break it into milestones"}
          </p>
        </div>
      </div>

      <form action={createGoal} className="p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Goal Title <span className="text-milestone-red">*</span>
          </label>
          <input
            name="title"
            required
            autoFocus
            className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
            placeholder="e.g. Close the Acme deal, Run a 5K, Finish the deck renovation"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Group */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Group <span className="text-milestone-red">*</span>
            </label>
            <div className="relative">
              <select
                name="group_id"
                required
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white appearance-none cursor-pointer transition-all"
              >
                <option value="">Select…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Type
            </label>
            <div className="relative">
              <select
                name="goal_type"
                defaultValue={template?.goal_type ?? "concrete"}
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent bg-white appearance-none cursor-pointer transition-all"
              >
                <option value="concrete">Concrete</option>
                <option value="touches">Touches</option>
                <option value="deadline">Deadline</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Due Date
            </label>
            <input
              name="due_date"
              type="date"
              className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
            />
          </div>

          {/* Importance */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Importance
            </label>
            <input type="hidden" name="importance" value={importance} />
            <div className="flex gap-1 h-[42px]">
              {IMPORTANCE_OPTIONS.map(({ value, label, color, textColor }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setImportance(value)}
                  title={label}
                  className={`flex-1 flex items-center justify-center rounded-lg border transition-all text-xs font-semibold ${
                    importance === value
                      ? `border-transparent ${textColor} bg-gray-100 ring-2 ring-offset-1 ring-current`
                      : "border-milestone-line text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
              Milestones <span className="text-milestone-red">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustCount(milestoneCount - 1)}
                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-base transition-colors"
              >
                −
              </button>
              <span className="text-sm font-semibold text-gray-600 w-4 text-center tabular-nums">
                {milestoneCount}
              </span>
              <button
                type="button"
                onClick={() => adjustCount(milestoneCount + 1)}
                className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-base transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-2.5">
            {Array.from({ length: milestoneCount }, (_, i) => (
              <div key={i} className="flex items-center gap-1.5 flex-1">
                <div className="w-5 h-5 rounded-full border-2 border-milestone-blue bg-white flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-milestone-blue">{i + 1}</span>
                </div>
                {i < milestoneCount - 1 && <div className="flex-1 h-px bg-milestone-line" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from({ length: milestoneCount }, (_, i) => (
              <input
                key={i}
                name={`milestone_${i + 1}`}
                required={i === 0}
                value={milestoneValues[i] ?? ""}
                onChange={(e) => {
                  const next = [...milestoneValues];
                  next[i] = e.target.value;
                  setMilestoneValues(next);
                }}
                className="px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
                placeholder={`Step ${i + 1}${i === 0 ? " *" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="submit"
            className="bg-milestone-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
          >
            Create Goal
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
