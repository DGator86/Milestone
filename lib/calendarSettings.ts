export type CalendarRuleField =
  | "item_count"
  | "task_count"
  | "milestone_count"
  | "goal_count"
  | "critical_count"
  | "high_priority_count"
  | "overdue_count";

export type CalendarRuleOperator = "gte" | "lte" | "eq" | "gt" | "lt";

export interface CalendarRuleCondition {
  field: CalendarRuleField;
  operator: CalendarRuleOperator;
  value: number;
}

export interface CalendarRule {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  conditions: CalendarRuleCondition[];
}

export interface CalendarSettings {
  hideWeekends: boolean;
  rules: CalendarRule[];
}

export const CALENDAR_RULE_FIELDS: { value: CalendarRuleField; label: string }[] = [
  { value: "item_count", label: "Total items" },
  { value: "task_count", label: "CRM tasks" },
  { value: "milestone_count", label: "Milestones" },
  { value: "goal_count", label: "Goal deadlines" },
  { value: "critical_count", label: "Critical items" },
  { value: "high_priority_count", label: "High-priority items" },
  { value: "overdue_count", label: "Overdue items" },
];

export const CALENDAR_RULE_OPERATORS: { value: CalendarRuleOperator; label: string }[] = [
  { value: "gte", label: "≥" },
  { value: "gt", label: ">" },
  { value: "eq", label: "=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "≤" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_CALENDAR_RULES: CalendarRule[] = [
  {
    id: "heavy-day",
    name: "Heavy day",
    enabled: true,
    color: "#FEF3C7",
    conditions: [{ field: "item_count", operator: "gte", value: 5 }],
  },
  {
    id: "critical-load",
    name: "Critical load",
    enabled: true,
    color: "#FEE2E2",
    conditions: [{ field: "critical_count", operator: "gte", value: 2 }],
  },
  {
    id: "light-day",
    name: "Light day",
    enabled: true,
    color: "#DCFCE7",
    conditions: [{ field: "item_count", operator: "lte", value: 1 }],
  },
];

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  hideWeekends: false,
  rules: DEFAULT_CALENDAR_RULES,
};

function sanitizeCondition(raw: unknown): CalendarRuleCondition | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const field = o.field as CalendarRuleField;
  const operator = o.operator as CalendarRuleOperator;
  const value = Number(o.value);
  if (!CALENDAR_RULE_FIELDS.some((f) => f.value === field)) return null;
  if (!CALENDAR_RULE_OPERATORS.some((op) => op.value === operator)) return null;
  if (!Number.isFinite(value)) return null;
  return { field, operator, value: Math.max(0, Math.round(value)) };
}

function sanitizeRule(raw: unknown, index: number): CalendarRule | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim().slice(0, 60) : "";
  const colorRaw = typeof o.color === "string" ? o.color.trim() : "";
  const color = HEX.test(colorRaw) ? colorRaw : "#E5E7EB";
  const conditions = Array.isArray(o.conditions)
    ? o.conditions.map(sanitizeCondition).filter((c): c is CalendarRuleCondition => !!c)
    : [];
  if (!name || conditions.length === 0) return null;
  return {
    id: typeof o.id === "string" && o.id ? o.id : `rule-${index}`,
    name,
    enabled: o.enabled !== false,
    color,
    conditions,
  };
}

export function sanitizeCalendarSettings(raw: unknown): CalendarSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_CALENDAR_SETTINGS;
  const o = raw as Record<string, unknown>;
  const rulesRaw = Array.isArray(o.rules) ? o.rules : [];
  const rules = rulesRaw
    .map((rule, index) => sanitizeRule(rule, index))
    .filter((rule): rule is CalendarRule => !!rule);
  return {
    hideWeekends: o.hideWeekends === true,
    rules: rules.length > 0 ? rules : DEFAULT_CALENDAR_RULES,
  };
}

export function parseCalendarSettingsJson(raw: string | null): CalendarSettings {
  if (!raw) return DEFAULT_CALENDAR_SETTINGS;
  try {
    return sanitizeCalendarSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_CALENDAR_SETTINGS;
  }
}
