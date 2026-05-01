import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaults } from "./actions";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/dashboard/TopBar";
import MilestoneCharts from "@/components/dashboard/MilestoneCharts";
import TaskHealth from "@/components/dashboard/TaskHealth";
import Momentum from "@/components/dashboard/Momentum";
import CreateGoalForm from "@/components/forms/CreateGoalForm";
import type { GoalWithDetails, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureDefaults();

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

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

  const safeGroups: Group[] = groups ?? [];

  return (
    <AppShell user={user}>
      <div className="flex flex-col gap-0">
        <TopBar groups={safeGroups} />
        <div className="p-6 space-y-6">
          <MilestoneCharts goals={goals} groups={safeGroups} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskHealth goals={goals} />
            <Momentum goals={goals} />
          </div>
          <div id="create-goal">
            <CreateGoalForm groups={safeGroups} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
