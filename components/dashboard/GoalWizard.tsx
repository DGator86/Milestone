"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  X, ChevronRight, ChevronLeft, Target, Zap, Calendar, RefreshCw,
  Flag, Plus, Trash2, CalendarDays, Repeat,
} from "lucide-react";
import { createGoal } from "@/app/dashboard/actions";
import type { Group } from "@/lib/types";

const GOAL_TYPES = [
  { value: "concrete",    label: "Project",  description: "Defined end goal",  icon: Target,    color: "#1769FF" },
  { value: "touches",     label: "Habit",    description: "Regular cadence",   icon: Zap,       color: "#36A852" },
  { value: "deadline",    label: "Deadline", description: "Due by a date",     icon: Calendar,  color: "#F8B400" },
  { value: "maintenance", label: "Ongoing",  description: "Continuous work",   icon: RefreshCw, color: "#8B5CF6" },
];

const PERIODS = [
  { value: "day",   label: "day"   },
  { value: "week",  label: "week"  },
  { value: "month", label: "month" },
];

type ScheduleType = "none" | "date" | "frequency";

interface MilestoneItem {
  key: string;
  title: string;
  scheduleType: ScheduleType;
  date: string;
  touchTarget: number;
  touchPeriod: "day" | "week" | "month";
}

function defaultSchedule(goalType: string): ScheduleType {
  return goalType === "touches" || goalType === "maintenance" ? "frequency" : "none";
}

function newItem(goalType: string): MilestoneItem {
  return {
    key: Math.random().toString(36).slice(2),
    title: "",
    scheduleType: defaultSchedule(goalType),
    date: "",
    touchTarget: 1,
    touchPeriod: "week",
  };
}

export default function GoalWizard({
  groups,
  open,
  onClose,
  prefill,
}: {
  groups: Group[];
  open: boolean;
  onClose: () => void;
  prefill?: { title?: string; goal_type?: string; milestones?: string[] } | null;
}) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goalType, setGoalType] = useState("concrete");
  const [items, setItems] = useState<MilestoneItem[]>(() => [newItem("concrete"), newItem("concrete"), newItem("concrete")]);
  const [isPending, startTransition] = useTransition();
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;

  const groupId = groups[0]?.id ?? "";

  useEffect(() => {
    if (!open) return;
    const p = prefillRef.current;
    setStep(1);
    setEndDate("");
    if (p) {
      setTitle(p.title ?? "");
      const type = p.goal_type ?? "concrete";
      setGoalType(type);
      setItems(
        p.milestones?.length
          ? p.milestones.map((t) => ({ ...newItem(type), title: t }))
          : [newItem(type), newItem(type), newItem(type)]
      );
    } else {
      setTitle("");
      setGoalType("concrete");
      setItems([newItem("concrete"), newItem("concrete"), newItem("concrete")]);
    }
  }, [open]);

  function dismiss() {
    onClose();
  }

  function changeGoalType(type: string) {
    setGoalType(type);
    setItems((prev) =>
      prev.map((it) =>
        it.scheduleType === "none" || it.scheduleType === defaultSchedule(goalType)
          ? { ...it, scheduleType: defaultSchedule(type) }
          : it
      )
    );
  }

  function updateItem(key: string, patch: Partial<MilestoneItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, newItem(goalType)]);
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  function handleSubmit() {
    if (isPending || !groupId || !title.trim()) return;
    const filled = items.filter((it) => it.title.trim());
    if (filled.length === 0) return;

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("group_id", groupId);
    formData.set("goal_type", goalType);
    formData.set("importance", "normal");
    if (endDate) formData.set("due_date", endDate);

    filled.forEach((it, i) => {
      formData.set(`milestone_${i + 1}`, it.title.trim());
      formData.set(`milestone_${i + 1}_schedule`, it.scheduleType);
      if (it.scheduleType === "date" && it.date) {
        formData.set(`milestone_${i + 1}_date`, it.date);
      }
      if (it.scheduleType === "frequency") {
        formData.set(`milestone_${i + 1}_target`, String(it.touchTarget));
        formData.set(`milestone_${i + 1}_period`, it.touchPeriod);
      }
    });

    startTransition(() => createGoal(formData));
  }

  if (!open) return null;

  const canAdvance = title.trim().length > 0;
  const canSubmit = items.some((it) => it.title.trim()) && !isPending;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92dvh]">
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#1769FF] to-blue-600 rounded-t-3xl sm:rounded-t-2xl shrink-0">
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

          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    s === step ? "bg-white text-milestone-blue"
                      : s < step ? "bg-white/30 text-white"
                      : "bg-white/15 text-white/50"
                  }`}
                >
                  {s}
                </div>
                {s < 2 && <div className={`w-8 h-px ${s < step ? "bg-white/60" : "bg-white/20"}`} />}
              </div>
            ))}
            <span className="ml-1 text-blue-200 text-xs">Step {step} of 2</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
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
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  End date <span className="font-normal normal-case text-gray-300">(optional)</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
                />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Goal type</p>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_TYPES.map(({ value, label, description, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => changeGoalType(value)}
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

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 -mt-1 mb-1">
                Add steps toward your goal. Set a date or frequency for each.
              </p>

              {items.map((item, idx) => (
                <MilestoneRow
                  key={item.key}
                  item={item}
                  index={idx}
                  goalType={goalType}
                  canRemove={items.length > 1}
                  autoFocus={idx === 0}
                  onChange={(patch) => updateItem(item.key, patch)}
                  onRemove={() => removeItem(item.key)}
                />
              ))}

              <button
                onClick={addItem}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-milestone-blue hover:text-milestone-blue transition-all text-sm font-medium"
              >
                <Plus size={15} />
                Add step
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100 shrink-0">
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

function MilestoneRow({
  item,
  index,
  goalType,
  canRemove,
  autoFocus,
  onChange,
  onRemove,
}: {
  item: MilestoneItem;
  index: number;
  goalType: string;
  canRemove: boolean;
  autoFocus: boolean;
  onChange: (patch: Partial<MilestoneItem>) => void;
  onRemove: () => void;
}) {
  const isFrequencyDefault = goalType === "touches" || goalType === "maintenance";

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-milestone-blue bg-white flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-milestone-blue">{index + 1}</span>
        </div>
        <input
          autoFocus={autoFocus}
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={index === 0 ? "First step (required)" : `Step ${index + 1}`}
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-300 hover:text-milestone-red hover:bg-red-50 transition-colors shrink-0"
            aria-label="Remove step"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 pl-7">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-0.5">Schedule</span>
        {(["none", isFrequencyDefault ? "frequency" : "date"] as ScheduleType[]).concat(
          isFrequencyDefault ? [] : ["frequency" as ScheduleType]
        ).map((type) => {
          const label = type === "none" ? "None" : type === "date" ? "Date" : "Frequency";
          const Icon = type === "date" ? CalendarDays : type === "frequency" ? Repeat : null;
          return (
            <button
              key={type}
              onClick={() => onChange({ scheduleType: type })}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                item.scheduleType === type
                  ? "bg-milestone-blue text-white"
                  : "bg-white text-gray-400 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {Icon && <Icon size={11} />}
              {label}
            </button>
          );
        })}
      </div>

      {item.scheduleType === "date" && (
        <div className="pl-7">
          <input
            type="date"
            value={item.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
          />
        </div>
      )}

      {item.scheduleType === "frequency" && (
        <div className="pl-7 flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onChange({ touchTarget: Math.max(1, item.touchTarget - 1) })}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 font-bold text-sm transition-colors"
            >−</button>
            <span className="px-2 text-sm font-bold text-gray-800 min-w-[1.5rem] text-center tabular-nums">
              {item.touchTarget}
            </span>
            <button
              onClick={() => onChange({ touchTarget: Math.min(99, item.touchTarget + 1) })}
              className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 font-bold text-sm transition-colors"
            >+</button>
          </div>
          <span className="text-sm text-gray-500 font-medium">× per</span>
          <select
            value={item.touchPeriod}
            onChange={(e) => onChange({ touchPeriod: e.target.value as "day" | "week" | "month" })}
            className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent transition-all"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
