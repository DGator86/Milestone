import { groupOpenMilestones, milestoneBucket, type MilestoneBucket, type OpenMilestoneItem } from "@/lib/milestoneBuckets";
import { daysUntilDate } from "@/lib/dates";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

export type AgendaBucket = MilestoneBucket;

export const AGENDA_BUCKET_ORDER: AgendaBucket[] = ["overdue", "today", "tomorrow", "week", "later"];

export type AgendaMilestoneEntry = { kind: "milestone"; item: OpenMilestoneItem };
export type AgendaTaskEntry = { kind: "task"; task: CrmTask };
export type AgendaEntry = AgendaMilestoneEntry | AgendaTaskEntry;

export function taskAgendaBucket(task: CrmTask, today = new Date()): AgendaBucket | null {
  if (task.done || !task.due_date) return null;
  return milestoneBucket(daysUntilDate(task.due_date, today));
}

/** Unified agenda buckets for milestones (next step per goal) and open CRM tasks. */
export function buildAgendaBuckets(
  goals: GoalWithDetails[],
  tasks: CrmTask[],
  today = new Date(),
): Record<AgendaBucket, AgendaEntry[]> {
  const milestoneGroups = groupOpenMilestones(goals, today);
  const map: Record<AgendaBucket, AgendaEntry[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    later: [],
    noDate: [],
  };

  for (const bucket of AGENDA_BUCKET_ORDER) {
    for (const item of milestoneGroups[bucket]) {
      map[bucket].push({ kind: "milestone", item });
    }
  }

  // Undated next milestones are actionable today.
  for (const item of milestoneGroups.noDate) {
    map.today.push({ kind: "milestone", item });
  }

  for (const task of tasks) {
    const bucket = taskAgendaBucket(task, today);
    if (bucket && AGENDA_BUCKET_ORDER.includes(bucket)) {
      map[bucket].push({ kind: "task", task });
    }
  }

  return map;
}

export function hasAgendaItems(buckets: Record<AgendaBucket, AgendaEntry[]>): boolean {
  return AGENDA_BUCKET_ORDER.some((key) => buckets[key].length > 0);
}
