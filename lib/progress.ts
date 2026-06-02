import type { Milestone, GoalWithDetails } from "./types";

export function calcProgress(milestones: Milestone[]): number {
  if (!milestones.length) return 0;
  const completed = milestones.filter((m) => m.status === "completed").length;
  return Math.round((completed / milestones.length) * 100);
}

export function getNextMilestone(milestones: Milestone[]): Milestone | null {
  const sorted = [...milestones].sort((a, b) => a.position - b.position);
  return sorted.find((m) => m.status !== "completed") ?? null;
}

export function getKillList(goals: GoalWithDetails[]): Array<{
  goal: GoalWithDetails;
  milestone: Milestone;
}> {
  const items: Array<{ goal: GoalWithDetails; milestone: Milestone }> = [];
  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const next = getNextMilestone(goal.milestones ?? []);
    if (next) items.push({ goal, milestone: next });
  }
  return items;
}

export type GoalHealth = "on_track" | "at_risk" | "waiting";

export function getGoalHealth(goal: GoalWithDetails): GoalHealth {
  const ms = goal.milestones ?? [];
  const hasStuck = ms.some((m) => m.status === "stuck");
  const goalOverdue = goal.due_date && new Date(goal.due_date) < new Date();
  if (hasStuck || goalOverdue) return "at_risk";

  const next = getNextMilestone(ms);
  if (next?.due_date && new Date(next.due_date) < new Date()) return "at_risk";
  if (ms.some((m) => m.status === "waiting")) return "waiting";
  return "on_track";
}

export function getTaskHealth(goals: GoalWithDetails[]) {
  const stuck: GoalWithDetails[] = [];
  const needsAttention: GoalWithDetails[] = [];
  const waiting: GoalWithDetails[] = [];
  const onTrack: GoalWithDetails[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const ms = goal.milestones ?? [];
    const hasStuck = ms.some((m) => m.status === "stuck");
    const hasOverdue =
      goal.due_date && new Date(goal.due_date) < new Date();
    const hasWaiting = ms.some((m) => m.status === "waiting");

    if (hasStuck || hasOverdue) {
      stuck.push(goal);
    } else if (hasWaiting) {
      waiting.push(goal);
    } else {
      const next = getNextMilestone(ms);
      if (next?.due_date && new Date(next.due_date) < new Date()) {
        needsAttention.push(goal);
      } else {
        onTrack.push(goal);
      }
    }
  }

  return { stuck, needsAttention, waiting, onTrack };
}
