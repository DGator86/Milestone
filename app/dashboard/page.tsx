import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaults } from "./actions";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/dashboard/TopBar";
import MilestoneCharts from "@/components/dashboard/MilestoneCharts";
import TaskHealth from "@/components/dashboard/TaskHealth";
import Momentum from "@/components/dashboard/Momentum";
import CreateGoalForm from "@/components/forms/CreateGoalForm";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import RealtimeDashboard from "@/components/dashboard/RealtimeDashboard";
import GroupTabs from "@/components/dashboard/GroupTabs";
import GoalWizard from "@/components/dashboard/GoalWizard";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails, Group, GoalImportance } from "@/lib/types";

export const dynamic = "force-dynamic";

const IMPORTANCE_ORDER: Record<GoalImportance, number> = {
  critical: 0,
  important: 1,
  normal: 2,
};

function sortGoals(goals: GoalWithDetails[], by: string): GoalWithDetails[] {
  const copy = [...goals];
  switch (by) {
    case "due_date":
      return copy.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    case "progress":
      return copy.sort(
        (a, b) => calcProgress(b.milestones) - calcProgress(a.milestones)
      );
    case "name":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    default: // priority
      return copy.sort(
        (a, b) =>
          IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
      );
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureDefaults();

  const params = await searchParams;
  const filterGroup = params.group ?? "";
  const sortBy = params.sort ?? "priority";
  const filterStatus = params.status ?? "active";

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

  let query = supabase
    .from("goals")
    .select("*, groups(*), milestones(*)")
    .order("created_at", { ascending: true });

  if (filterStatus === "active") query = query.eq("status", "active");
  else if (filterStatus === "completed") query = query.eq("status", "completed");

  const { data: goalsRaw } = await query;

  let goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  if (filterGroup) {
    goals = goals.filter((g) => g.group_id === filterGroup);
  }

  goals = sortGoals(goals, sortBy);

  const safeGroups: Group[] = groups ?? [];

  return (
    <AppShell user={user}>
      <Suspense>
        <ToastTrigger />
      </Suspense>
      <RealtimeDashboard />
      {goals.length === 0 && <GoalWizard groups={safeGroups} />}
      <div className="flex flex-col">
        <TopBar
          groups={safeGroups}
          currentGroup={filterGroup}
          currentSort={sortBy}
          currentStatus={filterStatus}
        />
        <GroupTabs
          groups={safeGroups}
          currentGroup={filterGroup}
          currentSort={sortBy}
          currentStatus={filterStatus}
        />
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
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
