import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { ArrowLeft, Target, Briefcase, Home, Heart } from "lucide-react";
import { calcProgress } from "@/lib/progress";
import type { GoalWithDetails, Group, ActivityLog } from "@/lib/types";
import MilestoneList from "@/components/goals/MilestoneList";
import EditGoalPanel from "@/components/goals/EditGoalPanel";
import GoalStatusControls from "@/components/goals/GoalStatusControls";

export const dynamic = "force-dynamic";

const IMPORTANCE_CONFIG = {
  critical: { label: "Critical", bg: "bg-milestone-red-dim", text: "text-milestone-red" },
  important: { label: "Important", bg: "bg-milestone-amber-dim", text: "text-milestone-amber" },
  normal: { label: "Normal", bg: "bg-gray-100", text: "text-gray-500" },
};

const TYPE_LABELS: Record<string, string> = {
  concrete: "Concrete",
  touches: "Touches",
  deadline: "Deadline",
  maintenance: "Maintenance",
};

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatActivityAction(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case "goal_created":
      return `Goal created`;
    case "milestone_completed":
      return "Milestone marked complete";
    case "milestone_status_changed":
      return `Milestone status → ${metadata.status}`;
    default:
      return action.replace(/_/g, " ");
  }
}

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goalRaw } = await supabase
    .from("goals")
    .select("*, groups(*), milestones(*)")
    .eq("id", id)
    .single();

  if (!goalRaw) notFound();

  const goal: GoalWithDetails = {
    ...goalRaw,
    milestones: [...(goalRaw.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  };

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

  const { data: activityRaw } = await supabase
    .from("activity_log")
    .select("*")
    .eq("goal_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const safeGroups: Group[] = groups ?? [];
  const activity: ActivityLog[] = activityRaw ?? [];
  const progress = calcProgress(goal.milestones);
  const completedCount = goal.milestones.filter((m) => m.status === "completed").length;

  const imp = IMPORTANCE_CONFIG[goal.importance ?? "normal"] ?? IMPORTANCE_CONFIG.normal;
  const GroupIcon = GROUP_ICONS[goal.groups?.name] ?? Target;
  const isOverdue = goal.due_date && new Date(goal.due_date) < new Date();

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        {/* Back */}
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          All Goals
        </Link>

        {/* Goal header card */}
        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                  <GroupIcon size={12} />
                  {goal.groups?.name}
                </span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400 capitalize">
                  {TYPE_LABELS[goal.goal_type] ?? goal.goal_type}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${imp.bg} ${imp.text}`}
                >
                  {imp.label}
                </span>
                {goal.status !== "active" && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize bg-gray-100 text-gray-500">
                    {goal.status}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{goal.title}</h1>
              {goal.due_date && (
                <p
                  className={`text-xs mt-1.5 font-medium ${
                    isOverdue ? "text-milestone-red" : "text-gray-400"
                  }`}
                >
                  {isOverdue ? "Overdue · " : "Due "}
                  {new Date(goal.due_date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <EditGoalPanel goal={goal} groups={safeGroups} />
              <GoalStatusControls goalId={goal.id} status={goal.status} />
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5 pt-5 border-t border-milestone-line">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Progress
              </span>
              <span className="text-sm font-bold text-gray-700 tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor:
                    progress === 100 ? "#36A852" : progress > 50 ? "#1769FF" : "#F8B400",
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {completedCount} of {goal.milestones.length} milestones completed
            </p>
          </div>
        </div>

        {/* Milestones */}
        <MilestoneList goal={goal} />

        {/* Activity log */}
        {activity.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Recent Activity
            </p>
            <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden divide-y divide-milestone-line">
              {activity.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                  <p className="text-xs text-gray-600 flex-1">
                    {formatActivityAction(log.action, log.metadata)}
                  </p>
                  <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
