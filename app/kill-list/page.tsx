import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { getKillList } from "@/lib/progress";
import { Crosshair, AlertCircle, Clock, ArrowRight } from "lucide-react";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

function isOverdue(date: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

export default async function KillListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goalsRaw } = await supabase
    .from("goals")
    .select("*, groups(*), milestones(*)")
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  const killList = getKillList(goals);

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Crosshair size={20} className="text-milestone-red" />
            Kill List
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            One next action per active goal · tackle these to keep momentum
          </p>
        </div>

        {killList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
            <Crosshair size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">
              No pending milestones on active goals.
            </p>
            <p className="text-xs text-gray-300 mt-1">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
            {killList.map(({ goal, milestone }, index) => {
              const overdueGoal = isOverdue(goal.due_date);
              const overdueMilestone = isOverdue(milestone.due_date);
              const overdue = overdueGoal || overdueMilestone;
              const stuck = milestone.status === "stuck";
              const urgent = stuck || overdue;

              return (
                <div
                  key={goal.id}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/60 transition-colors ${
                    urgent ? "border-l-[3px]" : ""
                  } ${
                    stuck
                      ? "border-l-milestone-red"
                      : overdue
                      ? "border-l-milestone-amber"
                      : ""
                  }`}
                >
                  {/* Priority number */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      stuck
                        ? "bg-milestone-red-dim text-milestone-red"
                        : overdue
                        ? "bg-milestone-amber-dim text-milestone-amber"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {stuck ? (
                      <AlertCircle size={16} />
                    ) : (
                      <span className="tabular-nums">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
                        {goal.groups?.name ?? ""}
                      </span>
                      {urgent && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            stuck
                              ? "bg-milestone-red-dim text-milestone-red"
                              : "bg-milestone-amber-dim text-milestone-amber"
                          }`}
                        >
                          {stuck ? "Stuck" : "Overdue"}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug">
                      {goal.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ArrowRight size={12} className="text-gray-300 shrink-0" />
                      <p className="text-xs font-medium text-gray-500">{milestone.title}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {goal.due_date && (
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          overdueGoal
                            ? "text-milestone-red font-semibold"
                            : "text-gray-400"
                        }`}
                      >
                        <Clock size={12} />
                        {new Date(goal.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
