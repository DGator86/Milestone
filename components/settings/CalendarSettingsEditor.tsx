"use client";

import { useState } from "react";
import { Calendar, Plus, X, GripVertical } from "lucide-react";
import {
  CALENDAR_RULE_FIELDS,
  CALENDAR_RULE_OPERATORS,
  type CalendarRule,
  type CalendarRuleCondition,
  type CalendarSettings,
} from "@/lib/calendarSettings";

const INPUT = "ms-input";
const LABEL = "ms-label";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `rule_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function newRule(): CalendarRule {
  return {
    id: newId(),
    name: "New rule",
    enabled: true,
    color: "#E5E7EB",
    conditions: [{ field: "item_count", operator: "gte", value: 1 }],
  };
}

export default function CalendarSettingsEditor({ initial }: { initial: CalendarSettings }) {
  const [settings, setSettings] = useState<CalendarSettings>(initial);

  function patchRule(id: string, patch: Partial<CalendarRule>) {
    setSettings((s) => ({
      ...s,
      rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function removeRule(id: string) {
    setSettings((s) => ({ ...s, rules: s.rules.filter((r) => r.id !== id) }));
  }

  function addRule() {
    setSettings((s) => ({ ...s, rules: [...s.rules, newRule()] }));
  }

  function patchCondition(ruleId: string, index: number, patch: Partial<CalendarRuleCondition>) {
    setSettings((s) => ({
      ...s,
      rules: s.rules.map((r) => {
        if (r.id !== ruleId) return r;
        const conditions = r.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c));
        return { ...r, conditions };
      }),
    }));
  }

  function addCondition(ruleId: string) {
    setSettings((s) => ({
      ...s,
      rules: s.rules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: [...r.conditions, { field: "item_count", operator: "gte", value: 1 }] }
          : r,
      ),
    }));
  }

  function removeCondition(ruleId: string, index: number) {
    setSettings((s) => ({
      ...s,
      rules: s.rules.map((r) => {
        if (r.id !== ruleId) return r;
        const conditions = r.conditions.filter((_, i) => i !== index);
        return { ...r, conditions: conditions.length > 0 ? conditions : r.conditions };
      }),
    }));
  }

  function moveRule(id: string, direction: -1 | 1) {
    setSettings((s) => {
      const idx = s.rules.findIndex((r) => r.id === id);
      if (idx < 0) return s;
      const next = idx + direction;
      if (next < 0 || next >= s.rules.length) return s;
      const rules = [...s.rules];
      [rules[idx], rules[next]] = [rules[next], rules[idx]];
      return { ...s, rules };
    });
  }

  return (
    <div className="ms-card">
      <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
          <Calendar size={12} />
          Calendar
        </p>
      </div>

      <input type="hidden" name="calendar_settings" value={JSON.stringify(settings)} />

      <div className="p-5 space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700">Hide weekends</p>
            <p className="text-xs text-gray-400">Monthly and weekly views show Monday–Friday only</p>
          </div>
          <input
            type="checkbox"
            checked={settings.hideWeekends}
            onChange={(e) => setSettings((s) => ({ ...s, hideWeekends: e.target.checked }))}
            className="w-4 h-4 accent-milestone-blue cursor-pointer"
          />
        </label>

        <div className="border-t border-milestone-line pt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">Day color rules</p>
              <p className="text-xs text-gray-400">
                Excel-style conditions — first matching rule colors each day. All conditions in a rule must be true.
              </p>
            </div>
            <button
              type="button"
              onClick={addRule}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-milestone-line text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Plus size={13} /> Add rule
            </button>
          </div>

          {settings.rules.length === 0 ? (
            <p className="text-xs text-gray-400">No rules — days use the default background.</p>
          ) : (
            <div className="space-y-3">
              {settings.rules.map((rule, ruleIndex) => (
                <div key={rule.id} className="rounded-lg border border-milestone-line p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button
                        type="button"
                        onClick={() => moveRule(rule.id, -1)}
                        disabled={ruleIndex === 0}
                        className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        aria-label="Move rule up"
                      >
                        ▲
                      </button>
                      <GripVertical size={14} className="text-gray-300" />
                      <button
                        type="button"
                        onClick={() => moveRule(rule.id, 1)}
                        disabled={ruleIndex === settings.rules.length - 1}
                        className="text-[10px] text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        aria-label="Move rule down"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="color"
                      value={rule.color}
                      onChange={(e) => patchRule(rule.id, { color: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-milestone-line bg-white p-0.5 shrink-0"
                      aria-label="Rule color"
                    />
                    <input
                      value={rule.name}
                      onChange={(e) => patchRule(rule.id, { name: e.target.value })}
                      placeholder="Rule name"
                      maxLength={60}
                      className={`${INPUT} flex-1`}
                    />
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => patchRule(rule.id, { enabled: e.target.checked })}
                        className="w-3.5 h-3.5 accent-milestone-blue"
                      />
                      On
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-milestone-red shrink-0"
                      aria-label="Remove rule"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 pl-6">
                    {rule.conditions.map((cond, condIndex) => (
                      <div key={condIndex} className="flex flex-wrap items-center gap-2">
                        {condIndex > 0 && (
                          <span className="text-[10px] font-bold uppercase text-gray-400 w-full sm:w-auto">AND</span>
                        )}
                        <select
                          value={cond.field}
                          onChange={(e) =>
                            patchCondition(rule.id, condIndex, {
                              field: e.target.value as CalendarRuleCondition["field"],
                            })
                          }
                          className={`${INPUT} w-auto min-w-[8rem] text-sm`}
                        >
                          {CALENDAR_RULE_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={cond.operator}
                          onChange={(e) =>
                            patchCondition(rule.id, condIndex, {
                              operator: e.target.value as CalendarRuleCondition["operator"],
                            })
                          }
                          className={`${INPUT} w-auto text-sm`}
                        >
                          {CALENDAR_RULE_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={cond.value}
                          onChange={(e) =>
                            patchCondition(rule.id, condIndex, {
                              value: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className={`${INPUT} w-20 text-sm tabular-nums`}
                        />
                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCondition(rule.id, condIndex)}
                            className="p-1 text-gray-400 hover:text-milestone-red"
                            aria-label="Remove condition"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addCondition(rule.id)}
                      className="text-xs font-semibold text-milestone-blue hover:underline"
                    >
                      + Add condition
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 px-5 pb-4 -mt-2">
        Rules run top to bottom — like Excel conditional formatting. Use counts for total items, critical tasks, overdue work, and more.
      </p>
    </div>
  );
}
