"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, Columns3 } from "lucide-react";
import {
  buildCalendarByDate,
  buildMonthCalendar,
  monthGridCells,
  startOfWeek,
  addDays,
  weekDateKeys,
  type CalendarEntry,
} from "@/lib/calendarEntries";
import { computeDayStats, resolveDayColor } from "@/lib/calendarDayStats";
import type { CalendarSettings } from "@/lib/calendarSettings";
import type { GoalWithDetails, CrmTask } from "@/lib/types";
import { localDateKey } from "@/lib/dates";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const ALL_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr"];

type ViewMode = "month" | "week";

const KIND_LABEL: Record<CalendarEntry["kind"], string> = {
  goal: "Goal deadline",
  milestone: "Milestone",
  task: "CRM task",
  priority: "Priority",
};

function entryHref(entry: CalendarEntry): string {
  if (entry.kind === "task" && entry.taskId) return `/tasks/${entry.taskId}`;
  if (entry.goalId) return `/goals/${entry.goalId}`;
  return "/dashboard";
}

function formatWeekRange(keys: string[]) {
  if (keys.length === 0) return "";
  const start = new Date(keys[0] + "T12:00:00");
  const end = new Date(keys[keys.length - 1] + "T12:00:00");
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
  });
  return `${startStr} – ${endStr}`;
}

function DayDetailPanel({
  dateKey,
  items,
  onClose,
}: {
  dateKey: string;
  items: CalendarEntry[];
  onClose: () => void;
}) {
  const label = new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="border-t border-milestone-line dark:border-white/[0.08] animate-fade-up bg-white/80 dark:bg-[#0B1929]/80">
      <div className="flex items-center justify-between px-4 py-2 border-b border-milestone-line/60 dark:border-white/[0.05]">
        <p className="text-xs font-bold text-gray-900 dark:text-white">{label}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
        >
          Close
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-xs text-gray-400">Nothing scheduled on this day.</p>
      ) : (
        <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05] max-h-56 overflow-y-auto">
          {items.map((item, idx) => (
            <Link
              key={`${item.date}-${item.kind}-${item.goalId ?? item.taskId}-${idx}`}
              href={entryHref(item)}
              className="block px-4 py-3 active:bg-gray-50 dark:active:bg-white/[0.03]"
            >
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                {KIND_LABEL[item.kind]}
                {item.kind !== "task" ? ` · ${item.goalTitle}` : ""}
              </p>
              <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{item.label}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CalendarView({
  goals,
  tasks,
  calendarSettings,
}: {
  goals: GoalWithDetails[];
  tasks: CrmTask[];
  calendarSettings: CalendarSettings;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekAnchor, setWeekAnchor] = useState(startOfWeek(today));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(localDateKey(today));
  const [mode, setMode] = useState<ViewMode>("month");

  const hideWeekends = calendarSettings.hideWeekends;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const byDate = useMemo(() => buildCalendarByDate(goals, tasks, today), [goals, tasks, today]);
  const monthData = useMemo(
    () => buildMonthCalendar(goals, tasks, year, month, today),
    [goals, tasks, year, month, today],
  );
  const weekKeys = useMemo(() => weekDateKeys(weekAnchor, hideWeekends), [weekAnchor, hideWeekends]);
  const { cols, cells } = useMemo(
    () => monthGridCells(year, month, hideWeekends),
    [year, month, hideWeekends],
  );
  const dayHeaders = hideWeekends ? WEEKDAY_HEADERS : ALL_DAYS;

  const selectedItems = selectedDateKey ? (byDate.get(selectedDateKey) ?? []) : [];

  function isTodayKey(dateKey: string) {
    return dateKey === localDateKey(today);
  }

  function dayStyle(dateKey: string) {
    const entries = byDate.get(dateKey) ?? [];
    const stats = computeDayStats(entries);
    const color = resolveDayColor(stats, calendarSettings);
    return color ? { backgroundColor: color } : undefined;
  }

  function shiftMonth(delta: number) {
    setViewDate(new Date(year, month + delta, 1));
    setSelectedDateKey(null);
  }

  function shiftWeek(delta: number) {
    setWeekAnchor(addDays(weekAnchor, delta * 7));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden w-full sm:w-auto shadow-sm">
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold transition-colors touch-manipulation ${
              mode === "month"
                ? "bg-milestone-blue text-white"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <CalendarDays size={13} />
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setMode("week")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold transition-colors touch-manipulation border-l border-milestone-line dark:border-white/[0.08] ${
              mode === "week"
                ? "bg-milestone-blue text-white"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Columns3 size={13} />
            Weekly
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center sm:text-right px-1">
          {monthData.agenda.length} items this month
        </p>
      </div>

      {mode === "month" ? (
        <div className="ms-card-app overflow-hidden border border-milestone-line dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between px-3 py-3 border-b border-milestone-line dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-100 dark:active:bg-white/[0.06]"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-100 dark:active:bg-white/[0.06]"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div
            className="grid border-b border-milestone-line dark:border-white/[0.08] bg-gray-50/30 dark:bg-white/[0.02]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {dayHeaders.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold text-gray-400 dark:text-white/35 py-2 border-r border-milestone-line/70 dark:border-white/[0.06] last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          <div
            className="grid gap-0 bg-milestone-line/40 dark:bg-white/[0.06] p-px"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {cells.map((cell, i) => {
              if (!cell) {
                return <div key={`blank-${i}`} className="min-h-[72px] bg-gray-50/40 dark:bg-[#07111F]/40" />;
              }
              const items = byDate.get(cell.dateKey) ?? [];
              const selected = selectedDateKey === cell.dateKey;
              const todayCell = isTodayKey(cell.dateKey);
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(selected ? null : cell.dateKey)}
                  style={dayStyle(cell.dateKey)}
                  className={`relative flex flex-col items-stretch text-left min-h-[72px] p-1.5 transition-all bg-white dark:bg-[#0B1929] hover:brightness-[0.98] dark:hover:brightness-110 ${
                    selected ? "ring-2 ring-inset ring-milestone-blue z-10" : ""
                  } ${todayCell && !selected ? "outline outline-1 outline-milestone-blue/40 -outline-offset-1" : ""}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        todayCell ? "text-milestone-blue" : "text-gray-700 dark:text-white/80"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {items.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-milestone-blue/15 text-milestone-blue tabular-nums">
                        {items.length}
                      </span>
                    )}
                  </div>
                  {items.length > 0 && (
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {items.slice(0, 2).map((item, idx) => (
                        <p
                          key={`${item.date}-${idx}`}
                          className="text-[9px] leading-tight text-gray-600 dark:text-white/55 truncate"
                        >
                          {item.label}
                        </p>
                      ))}
                      {items.length > 2 && (
                        <p className="text-[9px] text-gray-400">+{items.length - 2} more</p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <DayDetailPanel
              dateKey={selectedDateKey}
              items={selectedItems}
              onClose={() => setSelectedDateKey(null)}
            />
          )}
        </div>
      ) : (
        <div className="ms-card-app overflow-hidden border border-milestone-line dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between px-3 py-3 border-b border-milestone-line dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-100 dark:active:bg-white/[0.06]"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatWeekRange(weekKeys)}</p>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="ms-touch-icon rounded-xl text-gray-400 active:bg-gray-100 dark:active:bg-white/[0.06]"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div
            className="grid gap-px bg-milestone-line/50 dark:bg-white/[0.06] min-h-[320px]"
            style={{ gridTemplateColumns: `repeat(${weekKeys.length}, minmax(0, 1fr))` }}
          >
            {weekKeys.map((dateKey) => {
              const items = byDate.get(dateKey) ?? [];
              const d = new Date(dateKey + "T12:00:00");
              const todayCell = isTodayKey(dateKey);
              return (
                <div
                  key={dateKey}
                  style={dayStyle(dateKey)}
                  className={`flex flex-col min-w-0 bg-white dark:bg-[#0B1929] border-r border-milestone-line/40 dark:border-white/[0.05] last:border-r-0 ${
                    todayCell ? "ring-1 ring-inset ring-milestone-blue/50" : ""
                  }`}
                >
                  <div className="px-2 py-2 border-b border-milestone-line/60 dark:border-white/[0.05] text-center shrink-0">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className={`text-lg font-bold tabular-nums ${todayCell ? "text-milestone-blue" : "text-gray-800 dark:text-white"}`}>
                      {d.getDate()}
                    </p>
                    {items.length > 0 && (
                      <p className="text-[9px] font-semibold text-milestone-blue mt-0.5">{items.length} items</p>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-milestone-line/40 dark:divide-white/[0.04]">
                    {items.length === 0 ? (
                      <p className="text-[10px] text-gray-300 dark:text-white/20 p-2 text-center">—</p>
                    ) : (
                      items.map((item, idx) => (
                        <Link
                          key={`${dateKey}-${idx}`}
                          href={entryHref(item)}
                          className="block px-2 py-2 hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                        >
                          <p className="text-[9px] text-gray-400 uppercase">{KIND_LABEL[item.kind]}</p>
                          <p className="text-[11px] font-semibold text-gray-800 dark:text-white/90 leading-snug line-clamp-2">
                            {item.label}
                          </p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {calendarSettings.rules.some((r) => r.enabled) && (
        <div className="flex flex-wrap gap-2 px-1">
          {calendarSettings.rules.filter((r) => r.enabled).map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-white/45"
            >
              <span className="w-3 h-3 rounded border border-black/10" style={{ backgroundColor: rule.color }} />
              {rule.name}
            </span>
          ))}
          <Link href="/settings" className="text-[10px] font-semibold text-milestone-blue hover:underline ml-auto">
            Edit rules →
          </Link>
        </div>
      )}
    </div>
  );
}
