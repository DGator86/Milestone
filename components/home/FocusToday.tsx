"use client";

import { useTransition } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { getTopFocus } from "@/lib/progress";
import { completeMilestone } from "@/app/dashboard/actions";
import type { GoalWithDetails } from "@/lib/types";

function urgencyBadge(dateStr: string | null): { text: string; cls: string } | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const days = Math.round((date.getTime() - t0.getTime()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: "bg-milestone-red/15 text-milestone-red" };
  if (days === 0) return { text: "Due today", cls: "bg-milestone-amber/15 text-milestone-amber" };
  if (days <= 2) return { text: `${days}d left`, cls: "bg-milestone-amber/15 text-milestone-amber" };
  return null;
}

interface Props {
  goals: GoalWithDetails[];
  onNewGoal?: () => void;
}

export default function FocusToday({ goals, onNewGoal }: Props) {
  const [isPending, startTransition] = useTransition();
  const items = getTopFocus(goals, 3);

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  if (items.length === 0) {
    return (
      <section className="ms-surface px-5 py-8 text-center">
        <p className="text-gray-400 text-sm mb-4">No active goals yet.</p>
        <button
          onClick={onNewGoal}
          className="ms-btn-primary"
        >
          Create your first goal <ArrowRight size={13} />
        </button>
      </section>
    );
  }

  const [first, ...rest] = items;
  const badge = urgencyBadge(first.milestone.due_date);

  return (
    <section className="ms-surface overflow-hidden" style={{ opacity: isPending ? 0.75 : 1 }}>
      {/* ── Hero: #1 ranked action ── */}
      <div className="px-4 py-4 border-b border-milestone-line dark:border-white/[0.06] bg-gradient-to-r from-milestone-navy to-[#0d2040]">
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/35 mb-2">
          Up next
        </p>
        <p className="text-xs text-white/45 mb-1 truncate">
          {first.goal.title}
        </p>
        <p className="text-lg font-semibold text-white leading-snug mb-4">
          {first.milestone.title}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div>
            {badge ? (
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${badge.cls}`}>
                {badge.text}
              </span>
            ) : (
              <span className="text-[11px] text-white/30">No deadline</span>
            )}
          </div>
          <button
            onClick={() => handleComplete(first.milestone.id, first.goal.id)}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-milestone-navy px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0"
          >
            Mark done <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Rows: #2 and #3 ── */}
      {rest.length > 0 && (
        <div className="divide-y divide-milestone-line/70 dark:divide-white/[0.06]">
          {rest.map(({ goal, milestone }, i) => {
            const rowBadge = urgencyBadge(milestone.due_date);
            return (
              <div
                key={milestone.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-xs font-medium text-gray-300 dark:text-white/15 w-4 shrink-0 tabular-nums select-none">
                  {i + 2}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{goal.title}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white leading-snug truncate">
                    {milestone.title}
                  </p>
                  {rowBadge && (
                    <span className={`text-[10px] font-medium ${rowBadge.cls.split(" ")[1]}`}>
                      {rowBadge.text}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleComplete(milestone.id, goal.id)}
                  className="shrink-0 text-gray-300 dark:text-white/20 hover:text-milestone-green transition-colors p-1"
                  aria-label="Mark done"
                >
                  <CheckCircle size={17} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
