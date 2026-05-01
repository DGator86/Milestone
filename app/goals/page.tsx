import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Target, CheckCircle, Circle } from "lucide-react";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goalsRaw } = await supabase
    .from("goals")
    .select("*, groups(*), milestones(*)")
    .order("created_at", { ascending: false });

  const goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  return (
    <AppShell user={user}>
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Target size={22} className="text-milestone-blue" />
          All Goals
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-milestone-line divide-y divide-milestone-line">
          {goals.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Target size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No goals yet.</p>
            </div>
          )}
          {goals.map((goal) => {
            const progress = calcProgress(goal.milestones ?? []);
            return (
              <div key={goal.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                <div className="shrink-0">
                  {goal.status === "completed" ? (
                    <CheckCircle size={20} className="text-milestone-green" />
                  ) : (
                    <Circle size={20} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{goal.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {goal.groups?.name} · {goal.goal_type} · {goal.importance}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      goal.status === "active"
                        ? "bg-blue-100 text-milestone-blue"
                        : goal.status === "completed"
                        ? "bg-green-100 text-milestone-green"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {goal.status}
                  </span>
                  <p className="text-sm font-semibold text-gray-700 mt-1">{progress}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
