import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaults } from "./actions";
import AppShell from "@/components/layout/AppShell";
import CriticalPaths from "@/components/home/CriticalPaths";
import KillList from "@/components/home/KillList";
import CreateGoalForm from "@/components/forms/CreateGoalForm";
import GoalWizard from "@/components/dashboard/GoalWizard";
import RealtimeDashboard from "@/components/dashboard/RealtimeDashboard";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import type { GoalWithDetails, Group, CrmTask, CrmCustomer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureDefaults();

  const [{ data: groupsRaw }, { data: goalsRaw }, { data: tasksRaw }, { data: customersRaw }] =
    await Promise.all([
      supabase.from("groups").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("goals")
        .select("*, groups(*), milestones(*)")
        .eq("status", "active")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("crm_tasks")
        .select("*, crm_customers(id, name)")
        .eq("done", false),
      supabase.from("crm_customers").select("id, name").order("name"),
    ]);

  const goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  const safeGroups: Group[] = groupsRaw ?? [];
  const tasks: CrmTask[] = tasksRaw ?? [];
  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw ?? [];

  return (
    <AppShell user={user}>
      <Suspense>
        <ToastTrigger />
      </Suspense>
      <RealtimeDashboard />
      {goals.length === 0 && <GoalWizard groups={safeGroups} />}

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Paths + create */}
          <div className="lg:col-span-2 space-y-6">
            <CriticalPaths goals={goals} />
            <div id="create-goal">
              <CreateGoalForm groups={safeGroups} />
            </div>
          </div>

          {/* Kill List */}
          <div className="lg:col-span-1">
            <KillList tasks={tasks} customers={customers} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
