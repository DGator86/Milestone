"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { buildMonthCalendar, type CalendarEntry } from "@/lib/calendarEntries";
import type { CrmTask, GoalWithDetails } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type ViewMode = "month" | "agenda";

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

export default function CalendarView({
  goals,
  tasks,
}: {
  goals: GoalWithDetails[];
  tasks: CrmTask[];
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [mode, setMode] = useState<ViewMode>("month");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const { byDay, agenda } = useMemo(
    () => buildMonthCalendar(goals, tasks, year, month),
    [goals, tasks, year, month],
  );

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedItems = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-milestone-line dark:border-white/[0.08] overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "month"
                ? "bg-milestone-blue text-white"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <CalendarDays size={13} />
            Month
          </button>
          <button
            type="button"
            onClick={() => setMode("agenda")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "agenda"
                ? "bg-milestone-blue text-white"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <List size={13} />
            Detailed
          </button>
        </div>
        <p className="text-xs text-gray-400">{agenda.length} items this month</p>
      </div>

      {mode === "month" ? (
        <div className="bg-white dark:bg-[#0B1929] rounded-xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-milestone-line dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 px-2 pt-2 pb-0.5">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-300 dark:text-white/20 pb-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-2 pb-3 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} className="aspect-square" />;
              const items = byDay.get(day) ?? [];
              const sel = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(sel ? null : day)}
                  className={`relative flex flex-col items-center justify-center rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                    sel
                      ? "bg-milestone-blue text-white"
                      : isToday(day)
                      ? "border border-milestone-blue text-milestone-blue"
                      : "text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  <span>{day}</span>
                  {items.length > 0 && !sel && (
                    <span className="absolute bottom-0.5 text-[8px] font-bold text-milestone-blue leading-none">
                      {items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay !== null && (
            <div className="border-t border-milestone-line dark:border-white/[0.08] animate-fade-up">
              <div className="px-4 py-2 border-b border-milestone-line/60 dark:border-white/[0.05]">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {MONTHS[month]} {selectedDay}
                </p>
              </div>
              {selectedItems.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400">Nothing scheduled on this day.</p>
              ) : (
                <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05] max-h-48 overflow-y-auto">
                  {selectedItems.map((item, idx) => (
                    <Link
                      key={`${item.date}-${item.kind}-${item.goalId ?? item.taskId}-${idx}`}
                      href={entryHref(item)}
                      className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {KIND_LABEL[item.kind]}
                        {item.kind !== "task" ? ` · ${item.goalTitle}` : ""}
                      </p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{item.label}</p>
                      {item.kind === "task" && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.goalTitle}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0B1929] rounded-xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-milestone-line dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {agenda.length === 0 ? (
            <p className="px-4 py-8 text-sm text-gray-400 text-center">No scheduled items this month.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
              {agenda.map((item, idx) => (
                <Link
                  key={`${item.date}-${item.kind}-${item.goalId ?? item.taskId}-${idx}`}
                  href={entryHref(item)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      {new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold text-milestone-blue leading-none">
                      {item.day}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      {KIND_LABEL[item.kind]}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.goalTitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
