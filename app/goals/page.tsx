import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Target } from "lucide-react";
import { GoalsList } from "./GoalsList";
import type { GoalWithDetails, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

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

  const safeGroups: Group[] = groups ?? [];
  const active = goals.filter((g) => g.status === "active").length;
  const completed = goals.filter((g) => g.status === "completed").length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Target size={20} className="text-milestone-blue" />
              All Goals
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {active} active · {completed} completed
            </p>
          </div>
        </div>
        <GoalsList goals={goals} groups={safeGroups} />
      </div>
    </AppShell>
  );
}
