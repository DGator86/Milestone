"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import type { GoalWithDetails } from "@/lib/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type ViewMode = "month" | "agenda";

interface CalendarEntry {
  date: string;
  day: number;
  goalId: string;
  goalTitle: string;
  label: string;
  kind: "milestone" | "goal";
}

export default function CalendarView({ goals }: { goals: GoalWithDetails[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [mode, setMode] = useState<ViewMode>("month");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const { byDay, agenda } = useMemo(() => {
    const map = new Map<number, CalendarEntry[]>();
    const list: CalendarEntry[] = [];

    for (const goal of goals) {
      if (goal.status !== "active") continue;

      if (goal.due_date) {
        const [y, m, d] = goal.due_date.split("-").map(Number);
        if (y === year && m - 1 === month) {
          const entry: CalendarEntry = {
            date: goal.due_date,
            day: d,
            goalId: goal.id,
            goalTitle: goal.title,
            label: `Goal due: ${goal.title}`,
            kind: "goal",
          };
          const dayList = map.get(d) ?? [];
          dayList.push(entry);
          map.set(d, dayList);
          list.push(entry);
        }
      }

      for (const ms of goal.milestones ?? []) {
        if (!ms.due_date || ms.status === "completed") continue;
        const [y, m, d] = ms.due_date.split("-").map(Number);
        if (y === year && m - 1 === month) {
          const entry: CalendarEntry = {
            date: ms.due_date,
            day: d,
            goalId: goal.id,
            goalTitle: goal.title,
            label: ms.title,
            kind: "milestone",
          };
          const dayList = map.get(d) ?? [];
          dayList.push(entry);
          map.set(d, dayList);
          list.push(entry);
        }
      }
    }

    list.sort((a, b) => a.date.localeCompare(b.date) || a.goalTitle.localeCompare(b.goalTitle));
    return { byDay: map, agenda: list };
  }, [goals, year, month]);

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
        <p className="text-xs text-gray-400">{agenda.length} key dates this month</p>
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
                <p className="px-4 py-4 text-xs text-gray-400">Nothing due on this day.</p>
              ) : (
                <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05] max-h-48 overflow-y-auto">
                  {selectedItems.map((item, idx) => (
                    <Link
                      key={`${item.goalId}-${item.kind}-${idx}`}
                      href={`/goals/${item.goalId}`}
                      className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {item.kind === "goal" ? "Goal deadline" : item.goalTitle}
                      </p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{item.label}</p>
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
            <p className="px-4 py-8 text-sm text-gray-400 text-center">No goal or milestone dates this month.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
              {agenda.map((item, idx) => (
                <Link
                  key={`${item.date}-${item.goalId}-${item.kind}-${idx}`}
                  href={`/goals/${item.goalId}`}
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
                      {item.kind === "goal" ? "Goal deadline" : "Milestone"}
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
