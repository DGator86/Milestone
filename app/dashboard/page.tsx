import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaults } from "./actions";
import AppShell from "@/components/layout/AppShell";
import TopBar from "@/components/dashboard/TopBar";
import MilestoneCharts from "@/components/dashboard/MilestoneCharts";
import TaskHealth from "@/components/dashboard/TaskHealth";
import Momentum from "@/components/dashboard/Momentum";
import CreateGoalForm from "@/components/forms/CreateGoalForm";
import { calcProgress } from "@/lib/progress";
import { TEMPLATES } from "@/lib/templates";
import type { GoalWithDetails, Group, GoalType, GoalImportance } from "@/lib/types";

export const dynamic = "force-dynamic";

const IMPORTANCE_ORDER: Record<string, number> = { critical: 0, important: 1, normal: 2 };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    group?: string;
    sort?: string;
    status?: string;
    tpl?: string;
    ms?: string;
    gt?: string;
    imp?: string;
  }>;
}) {
  const params = await searchParams;
  const groupFilter = params.group ?? "";
  const sortParam = params.sort ?? "priority";
  const statusParam = params.status ?? "active";
  const templateId = params.tpl ?? "";
  const msParam = params.ms ?? "";
  const gtParam = params.gt ?? "";
  const impParam = params.imp ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureDefaults();

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

  let goalsQuery = supabase
    .from("goals")
    .select("*, groups(*), milestones(*)")
    .order("created_at", { ascending: true });

  if (statusParam === "completed") {
    goalsQuery = goalsQuery.eq("status", "completed");
  } else if (statusParam === "all") {
    // no status filter
  } else {
    goalsQuery = goalsQuery.eq("status", "active");
  }

  if (groupFilter) {
    goalsQuery = goalsQuery.eq("group_id", groupFilter);
  }

  const { data: goalsRaw } = await goalsQuery;

  let goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  if (sortParam === "due_date") {
    goals.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  } else if (sortParam === "progress") {
    goals.sort((a, b) => calcProgress(b.milestones) - calcProgress(a.milestones));
  } else if (sortParam === "name") {
    goals.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    goals.sort(
      (a, b) =>
        (IMPORTANCE_ORDER[a.importance] ?? 2) - (IMPORTANCE_ORDER[b.importance] ?? 2)
    );
  }

  const safeGroups: Group[] = groups ?? [];

  let template = templateId ? (TEMPLATES.find((t) => t.id === templateId) ?? null) : null;
  if (!template && msParam) {
    const milestones = msParam.split("|").filter(Boolean);
    if (milestones.length > 0) {
      template = {
        id: "ai-custom",
        title: "AI Suggestion",
        description: "AI-generated milestone plan",
        icon: "🤖",
        goal_type: (gtParam || "concrete") as GoalType,
        importance: (impParam || "normal") as GoalImportance,
        milestones,
        color: "from-purple-50 to-blue-50 border-purple-100",
      };
    }
  }

  return (
    <AppShell user={user}>
      <div className="flex flex-col gap-0">
        <TopBar
          groups={safeGroups}
          currentGroup={groupFilter}
          currentSort={sortParam}
          currentStatus={statusParam}
        />
        <div className="p-6 space-y-6">
          <MilestoneCharts goals={goals} groups={safeGroups} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaskHealth goals={goals} />
            <Momentum goals={goals} />
          </div>
          <div id="create-goal">
            <CreateGoalForm groups={safeGroups} template={template} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
