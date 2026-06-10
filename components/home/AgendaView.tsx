"use client";

import { useMemo, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import type { GoalWithDetails, Milestone } from "@/lib/types";

interface AgendaItem {
  goal: GoalWithDetails;
  milestone: Milestone;
  daysUntil: number | null;
}

type BucketKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "noDate";

const BUCKET_META: Record<BucketKey, { label: string; cls: string }> = {
  overdue:  { label: "Overdue",   cls: "text-milestone-red" },
  today:    { label: "Today",     cls: "text-milestone-amber" },
  tomorrow: { label: "Tomorrow",  cls: "text-gray-500 dark:text-white/40" },
  week:     { label: "This Week", cls: "text-gray-500 dark:text-white/40" },
  later:    { label: "Later",     cls: "text-gray-400 dark:text-white/30" },
  noDate:   { label: "No Date",   cls: "text-gray-300 dark:text-white/20" },
};

const BUCKET_ORDER: BucketKey[] = ["overdue", "today", "tomorrow", "week", "later", "noDate"];

function bucket(daysUntil: number | null): BucketKey {
  if (daysUntil === null) return "noDate";
  if (daysUntil < 0) return "overdue";
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil <= 7) return "week";
  return "later";
}

export default function AgendaView({ goals }: { goals: GoalWithDetails[] }) {
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map: Record<BucketKey, AgendaItem[]> = {
      overdue: [], today: [], tomorrow: [], week: [], later: [], noDate: [],
    };

    for (const goal of goals) {
      if (goal.status !== "active") continue;
      for (const ms of goal.milestones ?? []) {
        if (ms.status === "completed") continue;
        let daysUntil: number | null = null;
        if (ms.due_date) {
          const [y, m, d] = ms.due_date.split("-").map(Number);
          daysUntil = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
        }
        map[bucket(daysUntil)].push({ goal, milestone: ms, daysUntil });
      }
    }
    return map;
  }, [goals]);

  const hasAny = BUCKET_ORDER.some((k) => grouped[k].length > 0);

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  if (!hasAny) {
    return (
      <div className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card border border-milestone-line dark:border-white/[0.08] p-10 text-center">
        <p className="text-sm text-gray-400 dark:text-white/30">No upcoming milestones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ opacity: isPending ? 0.7 : 1 }}>
      {BUCKET_ORDER.map((key) => {
        const items = grouped[key];
        if (items.length === 0) return null;
        const { label, cls } = BUCKET_META[key];
        return (
          <div
            key={key}
            className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-milestone-line dark:border-white/[0.08]">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${cls}`}>
                {label} · {items.length}
              </span>
            </div>
            <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
              {items.map(({ goal, milestone }) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{goal.title}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate">
                      {milestone.title}
                    </p>
                  </div>
                  <button
                    onClick={() => handleComplete(milestone.id, goal.id)}
                    className="shrink-0 text-gray-200 dark:text-white/20 hover:text-milestone-green transition-colors p-0.5"
                    aria-label="Mark done"
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
