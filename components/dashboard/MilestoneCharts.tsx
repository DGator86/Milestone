"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Briefcase, Home, Heart, Target } from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails, Group, Milestone } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  completed: "#36A852",
  in_progress: "#F8B400",
  next: "#1769FF",
  waiting: "#1769FF",
  stuck: "#EA4335",
  upcoming: "#DFE6EF",
};

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

function getMilestoneColor(ms: Milestone, index: number, allMs: Milestone[]): string {
  if (ms.status === "completed") return "#36A852";
  if (ms.status === "stuck") return "#EA4335";
  if (ms.status === "in_progress") return "#F8B400";
  if (ms.status === "waiting") return "#1769FF";
  // Find first non-completed
  const firstActive = allMs.findIndex((m) => m.status !== "completed");
  if (index === firstActive) return "#1769FF";
  return "#DFE6EF";
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function MilestoneNode({
  ms,
  index,
  allMs,
  goalId,
  isLast,
}: {
  ms: Milestone;
  index: number;
  allMs: Milestone[];
  goalId: string;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const color = getMilestoneColor(ms, index, allMs);
  const isCompleted = ms.status === "completed";
  const isActive = ms.status === "in_progress" || ms.status === "waiting";
  const isClickable = isActive || ms.status === "stuck";

  function handleClick() {
    if (!isClickable) return;
    startTransition(async () => {
      await completeMilestone(ms.id, goalId);
    });
  }

  return (
    <div className="flex flex-col items-center relative">
      {/* Node */}
      <button
        onClick={handleClick}
        disabled={!isClickable || pending}
        title={isClickable ? `Complete: ${ms.title}` : ms.title}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
          isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"
        } ${pending ? "opacity-50" : ""}`}
        style={{
          borderColor: color,
          backgroundColor: isCompleted ? color : isActive ? "white" : "white",
        }}
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {isActive && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="3" fill={color} />
          </svg>
        )}
        {ms.status === "stuck" && (
          <span style={{ color: "#EA4335", fontSize: 10, fontWeight: 700 }}>!</span>
        )}
      </button>

      {/* Label */}
      <span
        className="text-xs mt-1 text-center leading-tight max-w-[72px]"
        style={{
          color: isActive ? "#111" : isCompleted ? "#36A852" : "#9CA3AF",
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {ms.title}
      </span>
    </div>
  );
}

function GoalRow({ goal }: { goal: GoalWithDetails }) {
  const [expanded, setExpanded] = useState(false);
  const progress = calcProgress(goal.milestones ?? []);
  const overdue = isOverdue(goal.due_date);
  const milestones = goal.milestones ?? [];

  const lineColor = (i: number) => {
    if (i >= milestones.length - 1) return "transparent";
    const next = milestones[i + 1];
    if (next.status === "completed") return "#36A852";
    return "#DFE6EF";
  };

  return (
    <div className="py-3 border-b border-milestone-line last:border-0">
      <div className="flex items-start gap-4">
        {/* Goal info */}
        <div className="w-48 shrink-0 flex items-center gap-2 pt-1">
          <Target size={16} className="text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-800 leading-tight">{goal.title}</span>
        </div>

        {/* Milestone line */}
        <div className="flex-1 flex items-start relative pt-1">
          {/* Connector lines */}
          <div className="absolute top-[13px] left-3.5 right-3.5 flex" style={{ zIndex: 0 }}>
            {milestones.slice(0, -1).map((ms, i) => (
              <div
                key={ms.id}
                className="flex-1 h-0.5"
                style={{ backgroundColor: lineColor(i) }}
              />
            ))}
          </div>

          {/* Nodes */}
          <div className="relative z-10 flex w-full justify-between">
            {milestones.map((ms, i) => (
              <MilestoneNode
                key={ms.id}
                ms={ms}
                index={i}
                allMs={milestones}
                goalId={goal.id}
                isLast={i === milestones.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Progress + due */}
        <div className="w-24 shrink-0 text-right pt-1 flex items-center gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">{progress}%</div>
            {goal.due_date && (
              <div className={`text-xs font-medium ${overdue ? "text-milestone-red" : "text-milestone-amber"}`}>
                Due {new Date(goal.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            )}
          </div>
          <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 hover:text-gray-600">
            <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupSection({ group, goals }: { group: Group; goals: GoalWithDetails[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const GroupIcon = GROUP_ICONS[group.name] ?? Target;

  if (goals.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide hover:text-gray-900 transition-colors"
      >
        <GroupIcon size={15} className="text-gray-400" />
        {group.name}
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>
      {!collapsed && (
        <div>
          {goals.map((goal) => (
            <GoalRow key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MilestoneCharts({
  goals,
  groups,
}: {
  goals: GoalWithDetails[];
  groups: Group[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-milestone-line p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            A. Milestone Charts
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">All bars are normalized to the same length</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap justify-end">
          {[
            { color: "#36A852", label: "Completed" },
            { color: "#1769FF", label: "Next" },
            { color: "#F8B400", label: "In Progress" },
            { color: "#EA4335", label: "Overdue" },
            { color: "#DFE6EF", label: "Upcoming" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {groups.map((group) => {
        const groupGoals = goals.filter((g) => g.group_id === group.id);
        return (
          <GroupSection key={group.id} group={group} goals={groupGoals} />
        );
      })}

      {goals.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Target size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No active goals yet. Create your first goal below.</p>
        </div>
      )}
    </div>
  );
}
