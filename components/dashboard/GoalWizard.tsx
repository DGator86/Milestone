"use client";

import { useState, useTransition } from "react";
import { X, ChevronRight, ChevronLeft, Target, Zap, Calendar, RefreshCw, Flag } from "lucide-react";
import { createGoal } from "@/app/dashboard/actions";
import type { Group } from "@/lib/types";

const GOAL_TYPES = [
  { value: "concrete", label: "Project", description: "Defined end goal", icon: Target, color: "#1769FF" },
  { value: "touches", label: "Habit", description: "Regular cadence", icon: Zap, color: "#36A852" },
  { value: "deadline", label: "Deadline", description: "Due by a date", icon: Calendar, color: "#F8B400" },
  { value: "maintenance", label: "Ongoing", description: "Continuous work", icon: RefreshCw, color: "#8B5CF6" },
];

export default function GoalWizard({
  groups,
  open,
  onClose,
}: {
  groups: Group[];
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("concrete");
  const [milestones, setMilestones] = useState(["", "", ""]);
  const [isPending, startTransition] = useTransition();

  const groupId = groups[0]?.id ?? "";

  function reset() {
    setStep(1);
    setTitle("");
    setGoalType("concrete");
    setMilestones(["", "", ""]);
  }

  function dismiss() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (isPending || !groupId || !title.trim()) return;
    const filled = milestones.filter((m) => m.trim());
    if (filled.length === 0) return;

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("group_id", groupId);
    formData.set("goal_type", goalType);
    formData.set("importance", "normal");
    filled.forEach((m, i) => formData.set(`milestone_${i + 1}`, m));

    startTransition(() => createGoal(formData));
  }

  if (!open) return null;

  const canAdvance = title.trim().length > 0;
  const canSubmit = milestones.some((m) => m.trim()) && !isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#1769FF] to-blue-600">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flag size={15} className="text-blue-200" />
                <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest">
                  New Work Goal
                </span>
              </div>
              <p className="text-white text-lg font-bold leading-tight">
                {step === 1 ? "What do you want to achieve?" : "Break it into steps"}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    s === step
                      ? "bg-white text-milestone-blue"
                      : s < step
                      ? "bg-white/30 text-white"
                      : "bg-white/15 text-white/50"
                  }`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div className={`w-8 h-px ${s < step ? "bg-white/60" : "bg-white/20"}`} />
                )}
              </div>
            ))}
            <span className="ml-1 text-blue-200 text-xs">Step {step} of 2</span>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Step 1: Title + type */}
          {step === 1 && (
            <div className="space-y-4">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAdvance && setStep(2)}
                placeholder="e.g. Close the Acme deal"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:border-milestone-blue transition-colors"
              />

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Goal type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_TYPES.map(({ value, label, description, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setGoalType(value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                        goalType === value
                          ? "border-milestone-blue bg-milestone-blue-dim"
                          : "border-gray-100 bg-gray-50 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${goalType === value ? "text-milestone-blue" : "text-gray-700"}`}>
                          {label}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Milestones */}
          {step === 2 && (
            <div className="space-y-2.5">
              <p className="text-xs text-gray-400 mb-3">
                List 2–3 steps to reach this goal. You can add more later.
              </p>
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-milestone-blue bg-white flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-milestone-blue">{i + 1}</span>
                  </div>
                  <input
                    autoFocus={i === 0}
                    value={m}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[i] = e.target.value;
                      setMilestones(next);
                    }}
                    placeholder={i === 0 ? "First step (required)" : `Step ${i + 1}`}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!canAdvance}
              className="flex items-center gap-1.5 bg-milestone-blue text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 bg-milestone-blue text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Target size={15} />
              {isPending ? "Creating…" : "Create Goal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
