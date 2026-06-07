"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GoalWithDetails } from "@/lib/types";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface SlotItem {
  goalTitle: string;
  milestoneTitle: string;
  milestoneId: string;
}

export default function CalendarView({ goals }: { goals: GoalWithDetails[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const byDay = useMemo(() => {
    const map = new Map<number, SlotItem[]>();
    for (const goal of goals) {
      if (goal.status !== "active") continue;
      for (const ms of goal.milestones ?? []) {
        if (!ms.due_date || ms.status === "completed") continue;
        const [y, m, d] = ms.due_date.split("-").map(Number);
        if (y === year && m - 1 === month) {
          const list = map.get(d) ?? [];
          list.push({ goalTitle: goal.title, milestoneTitle: ms.title, milestoneId: ms.id });
          map.set(d, list);
        }
      }
    }
    return map;
  }, [goals, year, month]);

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedItems = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Month grid card */}
      <div className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-milestone-line dark:border-white/[0.08]">
          <button
            onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
            className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft size={17} />
          </button>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </p>
          <button
            onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
            className="p-1.5 rounded-lg text-gray-400 dark:text-white/30 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-gray-300 dark:text-white/20 pb-2">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 px-3 pb-4 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`b${i}`} />;
            const hasDots = byDay.has(day);
            const count = byDay.get(day)?.length ?? 0;
            const sel = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(sel ? null : day)}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-xl text-sm font-semibold transition-all ${
                  sel
                    ? "bg-milestone-blue text-white"
                    : isToday(day)
                    ? "border border-milestone-blue text-milestone-blue"
                    : "text-gray-700 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                }`}
              >
                {day}
                {hasDots && !sel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                      <span key={j} className="w-1 h-1 rounded-full bg-milestone-blue" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <div className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden animate-fade-up">
          <div className="px-5 py-3.5 border-b border-milestone-line dark:border-white/[0.08]">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {selectedDay}
            </p>
          </div>
          {selectedItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400 dark:text-white/30">
              Nothing due on this day.
            </p>
          ) : (
            <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
              {selectedItems.map((item) => (
                <div key={item.milestoneId} className="px-5 py-3.5">
                  <p className="text-[11px] text-gray-400 dark:text-white/40">{item.goalTitle}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {item.milestoneTitle}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
