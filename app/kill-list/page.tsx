import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { getKillList } from "@/lib/progress";
import { Crosshair, AlertCircle, Clock } from "lucide-react";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

function isOverdue(date: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

export default async function KillListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Crosshair size={22} className="text-milestone-red" />
            Kill List
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            The next action from every active goal. Generated live.
          </p>
        </div>

        {killList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-milestone-line p-12 text-center">
            <Crosshair size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No active goals with pending milestones.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-milestone-line divide-y divide-milestone-line">
            {killList.map(({ goal, milestone }) => {
              const overdueGoal = isOverdue(goal.due_date);
              const overdueMilestone = isOverdue(milestone.due_date);
              const overdue = overdueGoal || overdueMilestone;
              const stuck = milestone.status === "stuck";

              return (
                <div
                  key={goal.id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                    stuck || overdue ? "border-l-4" : ""
                  } ${stuck ? "border-l-milestone-red" : overdue ? "border-l-milestone-amber" : ""}`}
                >
                  <div className="shrink-0">
                    {stuck ? (
                      <AlertCircle size={20} className="text-milestone-red" />
                    ) : overdue ? (
                      <AlertCircle size={20} className="text-milestone-amber" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-milestone-blue flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-milestone-blue" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {goal.groups?.name ?? ""}
                      </span>
                      {(stuck || overdue) && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            stuck
                              ? "bg-red-100 text-milestone-red"
                              : "bg-amber-100 text-milestone-amber"
                          }`}
                        >
                          {stuck ? "STUCK" : "OVERDUE"}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 mt-0.5">{goal.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      → <span className="font-medium text-gray-700">{milestone.title}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {goal.due_date && (
                      <div className={`flex items-center gap-1 text-sm ${overdueGoal ? "text-milestone-red font-semibold" : "text-gray-400"}`}>
                        <Clock size={13} />
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
