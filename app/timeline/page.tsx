import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Clock, Target, AlertCircle, CalendarDays, ArrowRight } from "lucide-react";
import { getNextMilestone, calcProgress } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

function groupGoals(goals: GoalWithDetails[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    overdue: goals.filter((g) => g.due_date && new Date(g.due_date) < now),
    thisWeek: goals.filter((g) => {
      if (!g.due_date) return false;
      const d = new Date(g.due_date);
      return d >= now && d < nextWeek;
    }),
    nextMonth: goals.filter((g) => {
      if (!g.due_date) return false;
      const d = new Date(g.due_date);
      return d >= nextWeek && d <= next30;
    }),
    later: goals.filter((g) => {
      if (!g.due_date) return false;
      return new Date(g.due_date) > next30;
    }),
    noDate: goals.filter((g) => !g.due_date),
  };
}

function GoalTimelineCard({ goal }: { goal: GoalWithDetails }) {
  const next = getNextMilestone(goal.milestones ?? []);
  const progress = calcProgress(goal.milestones ?? []);
  const overdue = goal.due_date && new Date(goal.due_date) < new Date();

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0 hover:bg-gray-50/60 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">
            {goal.groups?.name ?? ""}
          </span>
          {overdue && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-milestone-red-dim text-milestone-red uppercase">
              Overdue
            </span>
          )}
        </div>
        <p className="font-semibold text-gray-900 text-sm leading-snug">{goal.title}</p>
        {next && (
          <div className="flex items-center gap-1.5 mt-1">
            <ArrowRight size={11} className="text-gray-300 shrink-0" />
            <span className="text-xs text-gray-500">{next.title}</span>
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-2 justify-end mb-1">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: progress === 100 ? "#36A852" : "#1769FF",
              }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums text-gray-700 w-8 text-right">
            {progress}%
          </span>
        </div>
        {goal.due_date && (
          <p className={`text-[11px] font-medium ${overdue ? "text-milestone-red" : "text-gray-400"}`}>
            {new Date(goal.due_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  color,
  icon,
  goals,
}: {
  title: string;
  color: string;
  icon: React.ReactNode;
  goals: GoalWithDetails[];
}) {
  if (goals.length === 0) return null;
  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest ${color}`}>
        {icon}
        {title}
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white border border-current text-[10px]">
          {goals.length}
        </span>
      </div>
      <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
        {goals.map((g) => (
          <GoalTimelineCard key={g.id} goal={g} />
        ))}
      </div>
    </div>
  );
}

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const { overdue, thisWeek, nextMonth, later, noDate } = groupGoals(goals);
  const hasAny = goals.length > 0;

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarDays size={20} className="text-milestone-blue" />
            Timeline
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Active goals grouped by due date
          </p>
        </div>

        {!hasAny ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center">
            <Target size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No active goals yet.</p>
            <p className="text-xs text-gray-300 mt-1">Create your first goal on the dashboard.</p>
          </div>
        ) : (
          <>
            <Section
              title="Overdue"
              color="text-milestone-red"
              icon={<AlertCircle size={13} />}
              goals={overdue}
            />
            <Section
              title="This Week"
              color="text-milestone-amber"
              icon={<Clock size={13} />}
              goals={thisWeek}
            />
            <Section
              title="Next 30 Days"
              color="text-milestone-blue"
              icon={<CalendarDays size={13} />}
              goals={nextMonth}
            />
            <Section
              title="Later"
              color="text-gray-400"
              icon={<CalendarDays size={13} />}
              goals={later}
            />
            <Section
              title="No Due Date"
              color="text-gray-400"
              icon={<CalendarDays size={13} />}
              goals={noDate}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
