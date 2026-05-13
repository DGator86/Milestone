import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { Target, CheckCircle, Circle, Briefcase, Home, Heart } from "lucide-react";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

const IMPORTANCE_COLOR: Record<string, string> = {
  critical: "bg-milestone-red-dim text-milestone-red",
  important: "bg-milestone-amber-dim text-milestone-amber",
  normal: "bg-gray-100 text-gray-500",
};

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const other = goals.filter((g) => g.status !== "active" && g.status !== "completed");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Target size={20} className="text-milestone-blue" />
              All Goals
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {active.length} active · {completed.length} completed
            </p>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
            <Target size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No goals yet.</p>
            <p className="text-xs text-gray-300 mt-1">Head to the dashboard to create your first goal.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { label: "Active", items: active },
              { label: "Completed", items: completed },
              ...(other.length > 0 ? [{ label: "Other", items: other }] : []),
            ]
              .filter((s) => s.items.length > 0)
              .map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {section.label}
                    <span className="ml-2 font-semibold text-gray-300">{section.items.length}</span>
                  </p>
                  <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
                    {section.items.map((goal) => {
                      const progress = calcProgress(goal.milestones ?? []);
                      const GroupIcon = GROUP_ICONS[goal.groups?.name ?? ""] ?? Target;
                      return (
                        <Link
                          key={goal.id}
                          href={`/goals/${goal.id}`}
                          className="flex items-center gap-4 px-5 py-3.5 border-b border-milestone-line last:border-0 hover:bg-gray-50/60 transition-colors"
                        >
                          <div className="shrink-0">
                            {goal.status === "completed" ? (
                              <CheckCircle size={18} className="text-milestone-green" />
                            ) : (
                              <Circle size={18} className="text-gray-200" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{goal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <GroupIcon size={12} className="text-gray-400 shrink-0" />
                              <span className="text-xs text-gray-400">{goal.groups?.name}</span>
                              <span className="text-gray-200">·</span>
                              <span className="text-xs text-gray-400 capitalize">{goal.goal_type}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                  IMPORTANCE_COLOR[goal.importance ?? "normal"]
                                }`}
                              >
                                {goal.importance}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1.5 min-w-[80px]">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${progress}%`,
                                    backgroundColor:
                                      goal.status === "completed"
                                        ? "#36A852"
                                        : progress > 50
                                        ? "#1769FF"
                                        : "#F8B400",
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700 tabular-nums w-8 text-right">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
