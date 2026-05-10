import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { TrendingUp, Target, ArrowRight, DollarSign } from "lucide-react";
import Link from "next/link";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "active", label: "Active", color: "text-milestone-blue bg-milestone-blue-dim", bar: "#1769FF" },
  { key: "completed", label: "Won", color: "text-milestone-green bg-milestone-green-dim", bar: "#36A852" },
  { key: "archived", label: "Lost / Archived", color: "text-gray-400 bg-gray-100", bar: "#9CA3AF" },
];

function formatValue(val: number | null): string {
  if (!val) return "";
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val.toLocaleString()}`;
}

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goalsRaw } = await supabase
    .from("goals")
    .select("*, groups(*), milestones(*), contacts(*)")
    .order("created_at", { ascending: false });

  const goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  const totalActiveValue = goals
    .filter((g) => g.status === "active")
    .reduce((sum, g) => sum + (g.deal_value ?? 0), 0);

  const totalWonValue = goals
    .filter((g) => g.status === "completed")
    .reduce((sum, g) => sum + (g.deal_value ?? 0), 0);

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-milestone-blue" />
              Pipeline
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">All deals and their milestones</p>
          </div>
          {totalActiveValue > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold text-milestone-blue">{formatValue(totalActiveValue)}</p>
              <p className="text-[11px] text-gray-400">active pipeline</p>
            </div>
          )}
        </div>

        {/* Summary chips */}
        {(totalActiveValue > 0 || totalWonValue > 0) && (
          <div className="flex gap-3 mb-6 flex-wrap">
            {totalActiveValue > 0 && (
              <div className="flex items-center gap-1.5 bg-milestone-blue-dim text-milestone-blue text-xs font-semibold px-3 py-1.5 rounded-full">
                <DollarSign size={12} />
                {formatValue(totalActiveValue)} in play
              </div>
            )}
            {totalWonValue > 0 && (
              <div className="flex items-center gap-1.5 bg-milestone-green-dim text-milestone-green text-xs font-semibold px-3 py-1.5 rounded-full">
                <DollarSign size={12} />
                {formatValue(totalWonValue)} won
              </div>
            )}
          </div>
        )}

        {goals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
            <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No deals yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create a goal on the dashboard to start tracking deals.</p>
          </div>
        ) : (
          STAGES.map(({ key, label, color, bar }) => {
            const stageGoals = goals.filter((g) => g.status === key);
            if (stageGoals.length === 0) return null;

            return (
              <div key={key} className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${color}`}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">({stageGoals.length})</span>
                </div>
                <div className="bg-white rounded-xl border border-milestone-line overflow-hidden shadow-card">
                  {stageGoals.map((goal) => {
                    const progress = calcProgress(goal.milestones ?? []);
                    const nextMs = goal.milestones?.find((m) => m.status !== "completed");

                    return (
                      <div
                        key={goal.id}
                        className="flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/50 transition-colors"
                        style={{ borderLeftWidth: 3, borderLeftColor: bar }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                              {goal.groups?.name}
                            </span>
                            {(goal as GoalWithDetails & { contacts?: { name: string } }).contacts && (
                              <>
                                <span className="text-gray-200 text-xs">·</span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  {(goal as GoalWithDetails & { contacts?: { name: string } }).contacts?.name}
                                </span>
                              </>
                            )}
                            {goal.deal_value && (
                              <>
                                <span className="text-gray-200 text-xs">·</span>
                                <span className="text-[11px] font-bold text-milestone-green">
                                  {formatValue(goal.deal_value)}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 text-sm leading-snug">{goal.title}</p>
                          {nextMs && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <ArrowRight size={11} className="text-gray-300 shrink-0" />
                              <span className="text-xs text-gray-500">{nextMs.title}</span>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${progress}%`, backgroundColor: bar }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-gray-700 w-8 text-right">
                              {progress}%
                            </span>
                          </div>
                          {goal.due_date && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {new Date(goal.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {goals.length > 0 && (
          <div className="mt-2">
            <Link
              href="/dashboard#create-goal"
              className="flex items-center gap-3 bg-white border-2 border-dashed border-milestone-line rounded-xl px-6 py-4 text-sm text-gray-400 hover:border-milestone-blue hover:text-milestone-blue hover:bg-milestone-blue-dim transition-all w-full group"
            >
              <div className="w-7 h-7 rounded-lg border-2 border-dashed border-current flex items-center justify-center group-hover:bg-milestone-blue group-hover:border-milestone-blue group-hover:text-white transition-all">
                <Target size={15} />
              </div>
              <span className="font-medium">Add a deal on the dashboard</span>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
