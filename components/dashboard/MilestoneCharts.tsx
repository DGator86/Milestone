"use client";

import { useState, useTransition, useOptimistic } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Briefcase, Home, Heart, Target, CheckCircle2, Circle, AlertCircle, Clock, Loader } from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import { calcProgress } from "@/lib/progress";
import { useToast } from "@/lib/toast-context";
import type { GoalWithDetails, Group, Milestone, MilestoneStatus } from "@/lib/types";

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
  const firstActive = allMs.findIndex((m) => m.status !== "completed");
  if (index === firstActive) return "#1769FF";
  return "#E2E8F0";
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; cls: string; Icon: React.ComponentType<{ size?: number }> }> = {
  completed: { label: "Done", cls: "bg-milestone-green-dim text-milestone-green", Icon: CheckCircle2 },
  in_progress: { label: "In Progress", cls: "bg-milestone-amber-dim text-milestone-amber", Icon: Loader },
  waiting: { label: "Waiting", cls: "bg-milestone-blue-dim text-milestone-blue", Icon: Clock },
  stuck: { label: "Stuck", cls: "bg-milestone-red-dim text-milestone-red", Icon: AlertCircle },
  upcoming: { label: "Upcoming", cls: "bg-gray-100 text-gray-400", Icon: Circle },
};

function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const { label, cls } = STATUS_CONFIG[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

function MilestoneNode({
  ms,
  index,
  allMs,
  onComplete,
}: {
  ms: Milestone;
  index: number;
  allMs: Milestone[];
  isLast: boolean;
  onComplete: (ms: Milestone) => void;
}) {
  const color = getMilestoneColor(ms, index, allMs);
  const isCompleted = ms.status === "completed";
  const isActive = ms.status === "in_progress" || ms.status === "waiting";
  const isClickable = isActive || ms.status === "stuck";

  return (
    <div className="flex flex-col items-center relative">
      <button
        onClick={() => isClickable && onComplete(ms)}
        disabled={!isClickable}
        title={isClickable ? `Complete: ${ms.title}` : ms.title}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
          isClickable ? "cursor-pointer hover:scale-110 hover:shadow-sm" : "cursor-default"
        }`}
        style={{ borderColor: color, backgroundColor: isCompleted ? color : "white" }}
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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

      <span
        className="text-[11px] mt-1 text-center leading-tight max-w-[72px]"
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
  const [, startTransition] = useTransition();
  const { show } = useToast();
  const milestones = goal.milestones ?? [];

  const [optimisticMilestones, applyOptimistic] = useOptimistic(
    milestones,
    (state: Milestone[], completedId: string) =>
      state.map((m) =>
        m.id === completedId ? { ...m, status: "completed" as MilestoneStatus } : m
      )
  );

  function handleComplete(ms: Milestone) {
    startTransition(async () => {
      applyOptimistic(ms.id);
      await completeMilestone(ms.id, goal.id);
      show(`"${ms.title}" completed!`, "success");
    });
  }

  const progress = calcProgress(optimisticMilestones);
  const overdue = isOverdue(goal.due_date);

  const lineColor = (i: number) => {
    if (i >= optimisticMilestones.length - 1) return "transparent";
    const next = optimisticMilestones[i + 1];
    return next.status === "completed" ? "#36A852" : "#E2E8F0";
  };

  return (
    <div className="py-3 px-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start gap-4">
        <Link
          href={`/goals/${goal.id}`}
          className="w-44 shrink-0 flex items-center gap-2 pt-1 hover:text-milestone-blue transition-colors group"
        >
          <Target size={14} className="text-gray-300 group-hover:text-milestone-blue shrink-0 transition-colors" />
          <span className="text-[13px] font-semibold text-gray-800 group-hover:text-milestone-blue leading-tight transition-colors">
            {goal.title}
          </span>
        </Link>

        <div className="flex-1 flex items-start relative pt-1">
          <div className="absolute top-[13px] left-3.5 right-3.5 flex" style={{ zIndex: 0 }}>
            {optimisticMilestones.slice(0, -1).map((ms, i) => (
              <div
                key={ms.id}
                className="flex-1 h-0.5"
                style={{ backgroundColor: lineColor(i) }}
              />
            ))}
          </div>
          <div className="relative z-10 flex w-full justify-between">
            {optimisticMilestones.map((ms, i) => (
              <MilestoneNode
                key={ms.id}
                ms={ms}
                index={i}
                allMs={optimisticMilestones}
                isLast={i === optimisticMilestones.length - 1}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>

        <div className="w-28 shrink-0 text-right pt-1 flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 justify-end">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[40px]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: progress === 100 ? "#36A852" : "#1769FF",
                  }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 tabular-nums w-9 text-right">
                {progress}%
              </span>
            </div>
            {goal.due_date && (
              <p
                className={`text-[11px] font-medium mt-0.5 ${
                  overdue ? "text-milestone-red" : "text-gray-400"
                }`}
              >
                {overdue ? "Overdue · " : ""}
                {new Date(goal.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Collapse" : "Expand milestone details"}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <ChevronDown
              size={15}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 ml-48 border-t border-milestone-line pt-3 pb-1 space-y-1">
          {optimisticMilestones.map((ms, i) => (
            <div key={ms.id} className="flex items-center gap-3 py-1 px-2 rounded-lg hover:bg-gray-50/80 transition-colors">
              <span className="text-[10px] font-bold text-gray-300 w-4 text-right tabular-nums shrink-0">
                {i + 1}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getMilestoneColor(ms, i, optimisticMilestones) }}
              />
              <span
                className={`text-xs flex-1 truncate ${
                  ms.status === "completed"
                    ? "line-through text-gray-400"
                    : ms.status === "in_progress" || ms.status === "stuck"
                    ? "font-semibold text-gray-800"
                    : "text-gray-600"
                }`}
              >
                {ms.title}
              </span>
              <MilestoneStatusBadge status={ms.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupSection({ group, goals }: { group: Group; goals: GoalWithDetails[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const GroupIcon = GROUP_ICONS[group.name] ?? Target;

  if (goals.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 mb-2 w-full text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
      >
        <GroupIcon size={13} />
        {group.name}
        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold text-[10px]">
          {goals.length}
        </span>
        {collapsed ? (
          <ChevronRight size={12} className="ml-auto" />
        ) : (
          <ChevronDown size={12} className="ml-auto" />
        )}
      </button>
      {!collapsed && (
        <div className="rounded-lg border border-milestone-line overflow-hidden">
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
    <div className="bg-white rounded-xl shadow-card border border-milestone-line p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-400">
            Goal Progress
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Click active nodes to mark complete
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {[
            { color: "#36A852", label: "Done" },
            { color: "#1769FF", label: "Next" },
            { color: "#F8B400", label: "In Progress" },
            { color: "#EA4335", label: "Stuck" },
            { color: "#E2E8F0", label: "Upcoming" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 text-[11px] text-gray-400">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      {groups.map((group) => {
        const groupGoals = goals.filter((g) => g.group_id === group.id);
        return <GroupSection key={group.id} group={group} goals={groupGoals} />;
      })}

      {goals.length === 0 && (
        <div className="text-center py-14">
          <Target size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">No active goals yet.</p>
          <p className="text-xs text-gray-300 mt-1">
            Create your first goal below to get started.
          </p>
        </div>
      )}
    </div>
  );
}
