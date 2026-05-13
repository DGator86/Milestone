"use client";

import { useState, useEffect, useTransition } from "react";
import { X, ChevronRight, ChevronLeft, Target, Sparkles } from "lucide-react";
import { createGoal } from "@/app/dashboard/actions";
import type { Group } from "@/lib/types";

const GOAL_TYPES = [
  { value: "concrete", label: "Project", description: "Defined goal with a clear finish line", emoji: "🎯" },
  { value: "touches", label: "Habit", description: "Regular activity to keep up over time", emoji: "⚡" },
  { value: "deadline", label: "Deadline", description: "Must be done by a specific date", emoji: "📅" },
  { value: "maintenance", label: "Ongoing", description: "Continuous work, no end date", emoji: "🔄" },
];

const STORAGE_KEY = "wizard_dismissed";

export default function GoalWizard({ groups }: { groups: Group[] }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [groupId, setGroupId] = useState("");
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("concrete");
  const [milestones, setMilestones] = useState(["", "", ""]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleSubmit() {
    const filled = milestones.filter((m) => m.trim());
    if (!groupId || !title.trim() || filled.length === 0) return;
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("group_id", groupId);
    formData.set("goal_type", goalType);
    formData.set("importance", "normal");
    filled.forEach((m, i) => formData.set(`milestone_${i + 1}`, m));
    localStorage.setItem(STORAGE_KEY, "1");
    startTransition(() => createGoal(formData));
  }

  if (!visible) return null;

  const canAdvance1 = !!groupId;
  const canAdvance2 = !!title.trim();
  const canSubmit = milestones.some((m) => m.trim());

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-milestone-line bg-gradient-to-r from-blue-50 to-white">
          <div className="w-8 h-8 rounded-lg bg-milestone-blue flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Create your first goal</p>
            <p className="text-xs text-gray-400">Step {step} of 3</p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Skip wizard"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "bg-milestone-blue" : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        <div className="px-6 py-5">
          {/* Step 1: Choose group */}
          {step === 1 && (
            <div>
              <p className="text-base font-bold text-gray-900 mb-1">Which area of life is this goal for?</p>
              <p className="text-xs text-gray-400 mb-4">You can create more groups later in settings.</p>
              <div className="grid grid-cols-1 gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGroupId(g.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      groupId === g.id
                        ? "border-milestone-blue bg-milestone-blue-dim text-milestone-blue"
                        : "border-milestone-line text-gray-700 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: g.color ?? "#1769FF" }}
                    />
                    {g.name}
                    {groupId === g.id && <Target size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Title + type */}
          {step === 2 && (
            <div>
              <p className="text-base font-bold text-gray-900 mb-1">What do you want to achieve?</p>
              <p className="text-xs text-gray-400 mb-4">Be specific — a clear title makes milestones easier to write.</p>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Launch the new website"
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue mb-4"
              />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Goal type</p>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setGoalType(t.value)}
                    className={`flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                      goalType === t.value
                        ? "border-milestone-blue bg-milestone-blue-dim"
                        : "border-milestone-line bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-base">{t.emoji}</span>
                    <span className={`text-xs font-bold ${goalType === t.value ? "text-milestone-blue" : "text-gray-700"}`}>
                      {t.label}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-tight">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Milestones */}
          {step === 3 && (
            <div>
              <p className="text-base font-bold text-gray-900 mb-1">Break it into steps</p>
              <p className="text-xs text-gray-400 mb-4">List 2–3 key milestones. You can always add more later.</p>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-milestone-blue flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-milestone-blue">{i + 1}</span>
                    </div>
                    <input
                      autoFocus={i === 0}
                      value={m}
                      onChange={(e) => {
                        const next = [...milestones];
                        next[i] = e.target.value;
                        setMilestones(next);
                      }}
                      placeholder={`Step ${i + 1}${i === 0 ? " (required)" : ""}`}
                      className="flex-1 px-3.5 py-2.5 border border-milestone-line rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-milestone-line bg-gray-50/60">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
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
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canAdvance1 : !canAdvance2}
              className="flex items-center gap-1.5 bg-milestone-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-1.5 bg-milestone-blue text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
            >
              <Target size={15} />
              Create Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
