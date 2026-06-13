import { dayOfMonth, isSameLocalMonth, localDateKey, toDateKey } from "@/lib/dates";
import {
  collectScheduledMilestones,
  collectScheduledTasks,
  type AnchorSource,
} from "@/lib/scheduleAnchor";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

export type CalendarEntryKind = "milestone" | "goal" | "task" | "priority";

export interface CalendarEntry {
  date: string;
  day: number;
  goalId?: string;
  taskId?: string;
  goalTitle: string;
  label: string;
  kind: CalendarEntryKind;
  anchorSource: AnchorSource;
  isCritical?: boolean;
  isHighPriority?: boolean;
  isOverdue?: boolean;
}

function pushEntry(map: Map<string, CalendarEntry[]>, entry: CalendarEntry) {
  const dayList = map.get(entry.date) ?? [];
  dayList.push(entry);
  map.set(entry.date, dayList);
}

function calendarKind(source: AnchorSource): CalendarEntryKind {
  if (source === "goal") return "goal";
  if (source === "task") return "task";
  if (source === "priority") return "priority";
  return "milestone";
}

function goalFlags(goal: GoalWithDetails) {
  return {
    isCritical: goal.importance === "critical",
    isHighPriority: goal.importance === "important" || goal.importance === "critical",
  };
}

function taskFlags(task: CrmTask, daysUntil: number) {
  return {
    isCritical: task.priority === "critical",
    isHighPriority: task.priority === "critical" || task.priority === "high",
    isOverdue: daysUntil < 0,
  };
}

/** Collect all scheduled entries keyed by YYYY-MM-DD. */
export function buildCalendarByDate(
  goals: GoalWithDetails[],
  tasks: CrmTask[],
  today = new Date(),
): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    if (!goal.due_date) continue;
    const date = toDateKey(goal.due_date);
    if (!date) continue;
    const day = dayOfMonth(date);
    if (!day) continue;
    const entry: CalendarEntry = {
      date,
      day,
      goalId: goal.id,
      goalTitle: goal.title,
      label: `Goal due: ${goal.title}`,
      kind: "goal",
      anchorSource: "goal",
      ...goalFlags(goal),
      isOverdue: false,
    };
    pushEntry(map, entry);
  }

  for (const { goal, milestone, anchor, daysUntil } of collectScheduledMilestones(goals, today)) {
    const day = dayOfMonth(anchor.dateKey);
    if (!day) continue;
    const entry: CalendarEntry = {
      date: anchor.dateKey,
      day,
      goalId: goal.id,
      goalTitle: goal.title,
      label: milestone.title,
      kind: calendarKind(anchor.source),
      anchorSource: anchor.source,
      ...goalFlags(goal),
      isOverdue: daysUntil < 0,
    };
    pushEntry(map, entry);
  }

  for (const { task, anchor, daysUntil } of collectScheduledTasks(tasks, today)) {
    const day = dayOfMonth(anchor.dateKey);
    if (!day) continue;
    const entry: CalendarEntry = {
      date: anchor.dateKey,
      day,
      taskId: task.id,
      goalTitle: task.crm_customers?.name ?? "CRM",
      label: task.title,
      kind: calendarKind(anchor.source),
      anchorSource: anchor.source,
      ...taskFlags(task, daysUntil),
    };
    pushEntry(map, entry);
  }

  return map;
}

/** Build month calendar entries from scheduled goals, milestones, and CRM tasks. */
export function buildMonthCalendar(
  goals: GoalWithDetails[],
  tasks: CrmTask[],
  year: number,
  month: number,
  today = new Date(),
): { byDay: Map<number, CalendarEntry[]>; byDate: Map<string, CalendarEntry[]>; agenda: CalendarEntry[] } {
  const byDate = buildCalendarByDate(goals, tasks, today);
  const byDay = new Map<number, CalendarEntry[]>();
  const agenda: CalendarEntry[] = [];

  for (const [date, entries] of byDate) {
    if (!isSameLocalMonth(date, year, month)) continue;
    const day = dayOfMonth(date);
    if (!day) continue;
    byDay.set(day, entries);
    agenda.push(...entries);
  }

  agenda.sort((a, b) => a.date.localeCompare(b.date) || a.goalTitle.localeCompare(b.goalTitle));
  return { byDay, byDate, agenda };
}

export function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export function weekDateKeys(anchor: Date, hideWeekends = false) {
  const start = startOfWeek(anchor);
  const keys: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(start, i);
    const dow = d.getDay();
    if (hideWeekends && (dow === 0 || dow === 6)) continue;
    keys.push(localDateKey(d));
  }
  return keys;
}

function weekdayColumn(dow: number) {
  if (dow === 0 || dow === 6) return -1;
  return dow - 1;
}

export function monthGridCells(year: number, month: number, hideWeekends = false) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const cols = hideWeekends ? 5 : 7;
  const cells: Array<{ day: number; dateKey: string; dow: number } | null> = [];

  if (!hideWeekends) {
    for (let i = 0; i < firstDow; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(year, month, day);
      cells.push({ day, dateKey: localDateKey(d), dow: d.getDay() });
    }
    return { cols, cells };
  }

  let padded = false;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    const col = weekdayColumn(d.getDay());
    if (col < 0) continue;
    if (!padded) {
      for (let i = 0; i < col; i += 1) cells.push(null);
      padded = true;
    }
    cells.push({ day, dateKey: localDateKey(d), dow: d.getDay() });
  }

  while (cells.length % cols !== 0) cells.push(null);
  return { cols, cells };
}
