import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import MilestoneCharts from "@/components/dashboard/MilestoneCharts";
import TaskHealth from "@/components/dashboard/TaskHealth";
import Momentum from "@/components/dashboard/Momentum";
import { BarChart3 } from "lucide-react";
import type { GoalWithDetails, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: groupsRaw }, { data: goalsRaw }] = await Promise.all([
    supabase.from("groups").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("goals")
      .select("*, groups(*), milestones(*)")
      .order("created_at", { ascending: true }),
  ]);

  const goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));
  const groups: Group[] = groupsRaw ?? [];

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={20} className="text-milestone-blue" />
            Reports
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Progress, health, and momentum across your goals</p>
        </div>

        <MilestoneCharts goals={goals} groups={groups} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskHealth goals={goals} />
          <Momentum goals={goals} />
        </div>
      </div>
    </AppShell>
  );
}
