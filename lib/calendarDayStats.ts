import type { CalendarEntry } from "@/lib/calendarEntries";
import type { CalendarRule, CalendarRuleCondition, CalendarSettings } from "@/lib/calendarSettings";

export interface CalendarDayStats {
  item_count: number;
  task_count: number;
  milestone_count: number;
  goal_count: number;
  critical_count: number;
  high_priority_count: number;
  overdue_count: number;
}

export function emptyDayStats(): CalendarDayStats {
  return {
    item_count: 0,
    task_count: 0,
    milestone_count: 0,
    goal_count: 0,
    critical_count: 0,
    high_priority_count: 0,
    overdue_count: 0,
  };
}

export function computeDayStats(entries: CalendarEntry[]): CalendarDayStats {
  const stats = emptyDayStats();
  for (const entry of entries) {
    stats.item_count += 1;
    if (entry.kind === "task" || entry.kind === "priority") stats.task_count += 1;
    if (entry.kind === "milestone") stats.milestone_count += 1;
    if (entry.kind === "goal") stats.goal_count += 1;
    if (entry.isCritical) stats.critical_count += 1;
    if (entry.isHighPriority) stats.high_priority_count += 1;
    if (entry.isOverdue) stats.overdue_count += 1;
  }
  return stats;
}

function compareValues(actual: number, operator: CalendarRuleCondition["operator"], expected: number) {
  switch (operator) {
    case "gte":
      return actual >= expected;
    case "gt":
      return actual > expected;
    case "eq":
      return actual === expected;
    case "lt":
      return actual < expected;
    case "lte":
      return actual <= expected;
    default:
      return false;
  }
}

function ruleMatches(stats: CalendarDayStats, rule: CalendarRule) {
  if (!rule.enabled) return false;
  return rule.conditions.every((condition) =>
    compareValues(stats[condition.field], condition.operator, condition.value),
  );
}

/** First matching enabled rule wins (Excel-style priority order). */
export function resolveDayColor(stats: CalendarDayStats, settings: CalendarSettings): string | null {
  for (const rule of settings.rules) {
    if (ruleMatches(stats, rule)) return rule.color;
  }
  return null;
}
