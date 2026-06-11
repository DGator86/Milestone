import { getNextMilestone } from "@/lib/progress";
import { dayOfMonth, isSameLocalMonth, localDateKey, toDateKey } from "@/lib/dates";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

export type CalendarEntryKind = "milestone" | "goal" | "task" | "current";

export interface CalendarEntry {
  date: string;
  day: number;
  goalId?: string;
  taskId?: string;
  goalTitle: string;
  label: string;
  kind: CalendarEntryKind;
}

function pushEntry(map: Map<number, CalendarEntry[]>, entry: CalendarEntry) {
  const dayList = map.get(entry.day) ?? [];
  dayList.push(entry);
  map.set(entry.day, dayList);
}

/** Build month calendar entries from goals, milestones, and CRM tasks. */
export function buildMonthCalendar(
  goals: GoalWithDetails[],
  tasks: CrmTask[],
  year: number,
  month: number,
  today = new Date(),
): { byDay: Map<number, CalendarEntry[]>; agenda: CalendarEntry[] } {
  const map = new Map<number, CalendarEntry[]>();
  const list: CalendarEntry[] = [];
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const todayDay = today.getDate();

  for (const goal of goals) {
    if (goal.status !== "active") continue;

    if (goal.due_date && isSameLocalMonth(goal.due_date, year, month)) {
      const day = dayOfMonth(goal.due_date);
      if (!day) continue;
      const entry: CalendarEntry = {
        date: toDateKey(goal.due_date)!,
        day,
        goalId: goal.id,
        goalTitle: goal.title,
        label: `Goal due: ${goal.title}`,
        kind: "goal",
      };
      pushEntry(map, entry);
      list.push(entry);
    }

    for (const ms of goal.milestones ?? []) {
      if (ms.status === "completed" || !ms.due_date) continue;
      if (!isSameLocalMonth(ms.due_date, year, month)) continue;
      const day = dayOfMonth(ms.due_date);
      if (!day) continue;
      const entry: CalendarEntry = {
        date: toDateKey(ms.due_date)!,
        day,
        goalId: goal.id,
        goalTitle: goal.title,
        label: ms.title,
        kind: "milestone",
      };
      pushEntry(map, entry);
      list.push(entry);
    }

    if (isCurrentMonth) {
      const next = getNextMilestone(goal.milestones ?? []);
      if (next && !next.due_date) {
        const entry: CalendarEntry = {
          date: localDateKey(today),
          day: todayDay,
          goalId: goal.id,
          goalTitle: goal.title,
          label: next.title,
          kind: "current",
        };
        pushEntry(map, entry);
        list.push(entry);
      }
    }
  }

  for (const task of tasks) {
    if (task.done || !task.due_date) continue;
    if (!isSameLocalMonth(task.due_date, year, month)) continue;
    const day = dayOfMonth(task.due_date);
    if (!day) continue;
    const entry: CalendarEntry = {
      date: toDateKey(task.due_date)!,
      day,
      taskId: task.id,
      goalTitle: task.crm_customers?.name ?? "CRM",
      label: task.title,
      kind: "task",
    };
    pushEntry(map, entry);
    list.push(entry);
  }

  list.sort((a, b) => a.date.localeCompare(b.date) || a.goalTitle.localeCompare(b.goalTitle));
  return { byDay: map, agenda: list };
}
