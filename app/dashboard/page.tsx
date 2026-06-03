import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals, groups, milestones, crm_tasks, crm_customers } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { ensureDefaults } from "./actions";
import AppShell from "@/components/layout/AppShell";
import CriticalPaths from "@/components/home/CriticalPaths";
import KillList from "@/components/home/KillList";
import CreateGoalForm from "@/components/forms/CreateGoalForm";
import GoalWizard from "@/components/dashboard/GoalWizard";
import RealtimeDashboard from "@/components/dashboard/RealtimeDashboard";
import { ToastTrigger } from "@/components/ui/ToastTrigger";
import type { GoalWithDetails, Group, CrmTask, CrmCustomer, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const user: AppUser = { id: userId, email: session.user.email };

  await ensureDefaults();

  const [goalsRaw, safeGroups, tasksRaw, customersRaw] = await Promise.all([
    db.query.goals.findMany({
      where: and(eq(goals.user_id, userId), eq(goals.status, "active")),
      with: { groups: true, milestones: true },
      orderBy: [desc(goals.pinned), asc(goals.created_at)],
    }),
    db.query.groups.findMany({
      where: eq(groups.user_id, userId),
      orderBy: [asc(groups.sort_order)],
    }),
    db.query.crm_tasks.findMany({
      where: and(eq(crm_tasks.user_id, userId), eq(crm_tasks.done, false)),
      with: { crm_customers: true },
    }),
    db.select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
  ]);

  const goalsList = goalsRaw.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort(
      (a, b) => a.position - b.position
    ),
  })) as unknown as GoalWithDetails[];

  const tasks = tasksRaw as unknown as CrmTask[];
  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw;

  return (
    <AppShell user={user}>
      <Suspense>
        <ToastTrigger />
      </Suspense>
      <RealtimeDashboard />
      {goalsList.length === 0 && <GoalWizard groups={safeGroups as Group[]} />}

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CriticalPaths goals={goalsList} />
            <div id="create-goal">
              <CreateGoalForm groups={safeGroups as Group[]} />
            </div>
          </div>
          <div className="lg:col-span-1">
            <KillList tasks={tasks} customers={customers} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
