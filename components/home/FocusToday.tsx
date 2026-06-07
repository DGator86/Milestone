"use client";

import { useTransition } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { getTopFocus } from "@/lib/progress";
import { completeMilestone } from "@/app/dashboard/actions";
import type { GoalWithDetails } from "@/lib/types";

function dueDateLabel(dateStr: string | null): { text: string; cls: string } | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((date.getTime() - t0.getTime()) / 86400000);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: "text-milestone-red" };
  if (days === 0) return { text: "Due today", cls: "text-milestone-amber" };
  if (days <= 2) return { text: `${days}d left`, cls: "text-milestone-amber" };
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
      <section className="bg-white rounded-xl shadow-card border border-milestone-line p-10 text-center">
        <p className="text-sm font-medium text-gray-500">No active goals yet.</p>
        <button
          onClick={onNewGoal}
          className="mt-3 inline-flex items-center gap-1.5 bg-milestone-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          Create a goal
          <ArrowRight size={14} />
        </button>
      </section>
    );
  }

  return (
    <section
      className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden"
      style={{ opacity: isPending ? 0.7 : 1 }}
    >
      <div className="px-5 pt-4 pb-3 border-b border-milestone-line">
        <h2 className="text-[15px] font-bold text-gray-900 tracking-tight">Today&apos;s Focus</h2>
        <p className="text-xs text-gray-400 mt-0.5">Top {items.length} next actions, ranked by urgency</p>
      </div>
      <div className="divide-y divide-milestone-line/70">
        {items.map(({ goal, milestone }) => {
          const due = dueDateLabel(milestone.due_date);
          return (
            <div
              key={milestone.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-400 truncate">{goal.title}</p>
                <p className="text-[15px] font-semibold text-gray-900 leading-snug mt-0.5 truncate">
                  {milestone.title}
                </p>
                {due && (
                  <p className={`text-[11px] font-semibold mt-0.5 ${due.cls}`}>{due.text}</p>
                )}
              </div>
              <button
                onClick={() => handleComplete(milestone.id, goal.id)}
                className="shrink-0 text-gray-300 hover:text-milestone-green active:text-milestone-green transition-colors p-1"
                aria-label="Mark done"
              >
                <CheckCircle size={22} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
