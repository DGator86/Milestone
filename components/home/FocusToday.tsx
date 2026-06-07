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
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: "bg-milestone-red/20 text-milestone-red" };
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
      <section className="bg-[#07111F] rounded-2xl px-7 py-10 text-center">
        <p className="text-white/30 text-sm mb-5">No active goals yet.</p>
        <button
          onClick={onNewGoal}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#07111F] px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
        >
          Create your first goal <ArrowRight size={13} />
        </button>
      </section>
    );
  }

  const [first, ...rest] = items;
  const badge = urgencyBadge(first.milestone.due_date);

  return (
    <section className="rounded-2xl overflow-hidden shadow-card-lg" style={{ opacity: isPending ? 0.75 : 1 }}>
      {/* ── Hero: #1 ranked action ── */}
      <div className="bg-[#07111F] px-6 py-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/25 mb-5">
          Up Next
        </p>
        <p className="text-[11px] font-medium text-white/35 mb-1.5 truncate">
          {first.goal.title}
        </p>
        <p className="text-[22px] font-bold text-white leading-snug mb-6">
          {first.milestone.title}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div>
            {badge ? (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                {badge.text}
              </span>
            ) : (
              <span className="text-[11px] text-white/20">No deadline</span>
            )}
          </div>
          <button
            onClick={() => handleComplete(first.milestone.id, first.goal.id)}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 active:scale-95 text-[#07111F] px-4 py-2 rounded-full text-sm font-bold transition-all shrink-0"
          >
            Mark done <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Rows: #2 and #3 ── */}
      {rest.length > 0 && (
        <div className="bg-white divide-y divide-milestone-line/60">
          {rest.map(({ goal, milestone }, i) => {
            const rowBadge = urgencyBadge(milestone.due_date);
            return (
              <div
                key={milestone.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors"
              >
                <span className="text-[15px] font-black text-gray-200 w-4 shrink-0 tabular-nums select-none">
                  {i + 2}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 truncate">{goal.title}</p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug truncate">
                    {milestone.title}
                  </p>
                  {rowBadge && (
                    <span className={`text-[10px] font-bold ${rowBadge.cls.split(" ")[1]}`}>
                      {rowBadge.text}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleComplete(milestone.id, goal.id)}
                  className="shrink-0 text-gray-200 hover:text-milestone-green active:text-milestone-green transition-colors p-1"
                  aria-label="Mark done"
                >
                  <CheckCircle size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
