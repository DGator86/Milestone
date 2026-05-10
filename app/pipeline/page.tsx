import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { TrendingUp, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAGES = [
  { key: "active", label: "In Progress", color: "text-milestone-blue bg-milestone-blue-dim", bar: "#1769FF" },
  { key: "completed", label: "Completed", color: "text-milestone-green bg-milestone-green-dim", bar: "#36A852" },
  { key: "archived", label: "Archived", color: "text-gray-400 bg-gray-100", bar: "#9CA3AF" },
];

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

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp size={20} className="text-milestone-blue" />
            Pipeline
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Goals and their milestone steps</p>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
            <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No goals yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create a goal on the dashboard to get started.</p>
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
                    const milestones = goal.milestones ?? [];
                    const contact = (goal as GoalWithDetails & { contacts?: { name: string } }).contacts;

                    return (
                      <div
                        key={goal.id}
                        className="px-5 py-4 border-b border-milestone-line last:border-0"
                        style={{ borderLeftWidth: 3, borderLeftColor: bar }}
                      >
                        {/* Goal header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                                {goal.groups?.name}
                              </span>
                              {contact && (
                                <>
                                  <span className="text-gray-200 text-xs">·</span>
                                  <span className="text-[11px] text-gray-500 font-medium">{contact.name}</span>
                                </>
                              )}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm leading-snug">{goal.title}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: bar }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums text-gray-700 w-8 text-right">
                              {progress}%
                            </span>
                          </div>
                        </div>

                        {/* Milestone steps */}
                        <div className="space-y-1">
                          {milestones.map((ms, i) => {
                            const isCompleted = ms.status === "completed";
                            const isActive = ms.status === "in_progress" || ms.status === "waiting";
                            const isStuck = ms.status === "stuck";

                            return (
                              <div key={ms.id} className="flex items-center gap-2.5">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isCompleted
                                      ? "bg-milestone-green border-milestone-green"
                                      : isStuck
                                      ? "border-milestone-red"
                                      : isActive
                                      ? "border-milestone-blue"
                                      : "border-gray-200"
                                  }`}
                                >
                                  {isCompleted && (
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                      <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                  {isStuck && (
                                    <span className="text-milestone-red text-[8px] font-bold leading-none">!</span>
                                  )}
                                  {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-milestone-blue" />
                                  )}
                                </div>
                                <span
                                  className={`text-xs leading-snug ${
                                    isCompleted
                                      ? "line-through text-gray-300"
                                      : isActive
                                      ? "font-semibold text-gray-800"
                                      : isStuck
                                      ? "font-semibold text-milestone-red"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {ms.title}
                                </span>
                                {i === 0 && !isCompleted && milestones.length > 1 && (
                                  <ArrowRight size={10} className="text-gray-300 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {goal.due_date && (
                          <p className="text-[11px] text-gray-400 mt-2">
                            Due {new Date(goal.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
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
              <span className="font-medium">Add a new goal</span>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
