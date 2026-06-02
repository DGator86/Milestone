"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Star, Trophy, Check, Plus, Building2 } from "lucide-react";
import { calcProgress, getGoalHealth, type GoalHealth } from "@/lib/progress";
import { toggleGoalPinned } from "@/app/dashboard/task-actions";
import type { GoalWithDetails, Milestone } from "@/lib/types";

const HEALTH_META: Record<GoalHealth, { label: string; cls: string }> = {
  on_track: { label: "On Track", cls: "text-milestone-green" },
  at_risk: { label: "At Risk", cls: "text-milestone-amber" },
  waiting: { label: "Waiting", cls: "text-milestone-blue" },
};

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dotState(ms: Milestone, milestones: Milestone[]) {
  if (ms.status === "completed") return "done" as const;
  if (ms.status === "stuck") return "stuck" as const;
  const firstOpen = milestones.find((m) => m.status !== "completed");
  if (firstOpen && firstOpen.id === ms.id) return "current" as const;
  return "upcoming" as const;
}

function Journey({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p className="text-xs text-gray-300 mt-4">No milestones yet.</p>;
  }

  return (
    <div className="mt-5 flex items-start gap-1">
      {/* START */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
          Start
        </span>
        <div className="h-5 w-px" />
      </div>

      {/* Track */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-start justify-between">
          {milestones.map((ms, i) => {
            const state = dotState(ms, milestones);
            const isLast = i === milestones.length - 1;
            const nextDone =
              !isLast && ms.status === "completed" && milestones[i + 1].status === "completed";

            return (
              <div
                key={ms.id}
                className="relative flex flex-col items-center text-center"
                style={{ width: `${100 / milestones.length}%`, minWidth: 0 }}
              >
                {/* connector to next */}
                {!isLast && (
                  <span
                    className="absolute top-[14px] left-1/2 h-0.5"
                    style={{
                      width: "100%",
                      backgroundColor: nextDone ? "#36A852" : "#E2E8F0",
                      zIndex: 0,
                    }}
                  />
                )}
                {/* dot */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                    state === "done"
                      ? "bg-milestone-green border-milestone-green text-white"
                      : state === "current"
                      ? "bg-milestone-blue border-milestone-blue text-white ring-4 ring-milestone-blue/15"
                      : state === "stuck"
                      ? "bg-milestone-red border-milestone-red text-white"
                      : "bg-white border-gray-200 text-gray-300"
                  }`}
                >
                  {state === "done" ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                {/* label */}
                <span
                  className={`mt-1.5 text-[11px] leading-tight px-0.5 line-clamp-2 ${
                    state === "current"
                      ? "font-semibold text-gray-900"
                      : state === "done"
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {ms.title}
                </span>
                {ms.due_date && (
                  <span className="text-[10px] text-gray-300 mt-0.5">{fmtDate(ms.due_date)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DESTINATION */}
      <div className="flex flex-col items-center shrink-0 pl-1">
        <div className="w-7 h-7 rounded-full bg-milestone-amber-dim flex items-center justify-center">
          <Trophy size={14} className="text-milestone-amber" />
        </div>
        <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">
          Goal
        </span>
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: GoalWithDetails }) {
  const [isPending, startTransition] = useTransition();
  const milestones = goal.milestones ?? [];
  const progress = calcProgress(milestones);
  const health = HEALTH_META[getGoalHealth(goal)];
  const accent =
    health.label === "At Risk" ? "#F8B400" : health.label === "Waiting" ? "#1769FF" : "#36A852";

  function toggleStar() {
    startTransition(() => toggleGoalPinned(goal.id, !goal.pinned));
  }

  return (
    <div
      className="bg-white rounded-xl shadow-card border border-milestone-line p-5 border-l-[3px]"
      style={{ borderLeftColor: accent, opacity: isPending ? 0.6 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <Building2 size={17} style={{ color: accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/goals/${goal.id}`}
              className="font-bold text-gray-900 hover:text-milestone-blue transition-colors truncate"
            >
              {goal.title}
            </Link>
            <button
              onClick={toggleStar}
              className="shrink-0 transition-colors"
              aria-label={goal.pinned ? "Unpin goal" : "Pin goal"}
            >
              <Star
                size={15}
                className={goal.pinned ? "text-milestone-amber" : "text-gray-300 hover:text-milestone-amber"}
                fill={goal.pinned ? "#F8B400" : "none"}
              />
            </button>
          </div>
          {goal.groups?.name && (
            <p className="text-xs text-gray-400 mt-0.5">{goal.groups.name}</p>
          )}
        </div>

        <div className="flex items-center gap-6 shrink-0 text-right">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
              Progress
            </p>
            <p className="text-milestone-blue font-bold text-sm">{progress}%</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">
              Health
            </p>
            <p className={`font-bold text-sm ${health.cls}`}>{health.label}</p>
          </div>
        </div>
      </div>

      <Journey milestones={milestones} />
    </div>
  );
}

export default function CriticalPaths({ goals }: { goals: GoalWithDetails[] }) {
  return (
    <section>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Critical Paths</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Your active destination goals and progress
          </p>
        </div>
        <Link
          href="/dashboard#create-goal"
          className="flex items-center gap-1.5 bg-milestone-navy text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Goal
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
          <Trophy size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">No active goals yet.</p>
          <p className="text-xs text-gray-300 mt-1">Create a goal to map its path.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          <Link
            href="/goals"
            className="block text-center text-sm font-semibold text-milestone-blue hover:underline pt-1"
          >
            View all goals →
          </Link>
        </div>
      )}
    </section>
  );
}
