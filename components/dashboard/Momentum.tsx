import { CheckCircle, Flag, TrendingUp } from "lucide-react";
import type { GoalWithDetails } from "@/lib/types";

export default function Momentum({ goals }: { goals: GoalWithDetails[] }) {
  const today = new Date().toDateString();
  let milestonesCompletedToday = 0;
  let goalsAdvancedToday = 0;
  const goalsAdvancedSet = new Set<string>();

  for (const goal of goals) {
    for (const ms of goal.milestones ?? []) {
      if (ms.completed_at && new Date(ms.completed_at).toDateString() === today) {
        milestonesCompletedToday++;
        goalsAdvancedSet.add(goal.id);
      }
    }
  }
  goalsAdvancedToday = goalsAdvancedSet.size;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const activeDays = new Set<string>();
  for (const goal of goals) {
    for (const ms of goal.milestones ?? []) {
      if (ms.completed_at) {
        activeDays.add(new Date(ms.completed_at).toDateString());
      }
    }
  }

  let streak = 0;
  const checkDate = new Date();
  while (activeDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="bg-white rounded-xl shadow-card border border-milestone-line p-6">
      <div className="mb-4">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-gray-400">
          Momentum
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Your streak and daily progress</p>
      </div>

      <div className="flex gap-5">
        {/* Streak ring */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="relative w-[88px] h-[88px]">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={streak > 0 ? "#F8B400" : "#E2E8F0"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(streak / 30, 1) * 251.2} 251.2`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl leading-none">{streak > 0 ? "🔥" : "💤"}</span>
              <span className="text-[22px] font-bold text-gray-900 leading-tight tabular-nums">
                {streak}
              </span>
            </div>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 mt-1.5">Day Streak</p>
        </div>

        {/* Stats + week */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-milestone-green-dim flex items-center justify-center shrink-0">
              <CheckCircle size={16} className="text-milestone-green" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                {goalsAdvancedToday}
              </span>
              <span className="text-xs text-gray-400 ml-1.5">goals advanced today</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
              <Flag size={16} className="text-milestone-blue" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                {milestonesCompletedToday}
              </span>
              <span className="text-xs text-gray-400 ml-1.5">milestones completed</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-milestone-green-dim flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-milestone-green" />
            </div>
            <div>
              <span className="text-lg font-bold text-milestone-green tabular-nums">+12%</span>
              <span className="text-xs text-gray-400 ml-1.5">vs last week</span>
            </div>
          </div>

          {/* Week calendar */}
          <div className="flex items-end gap-1 pt-1">
            {weekDays.map((day, i) => {
              const isActive = activeDays.has(day.toDateString());
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold transition-all ${
                      isActive
                        ? "bg-milestone-green text-white"
                        : isToday
                        ? "ring-2 ring-milestone-green ring-offset-1 text-milestone-green bg-white"
                        : "bg-gray-100 text-gray-300"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium">
                    {dayLabels[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
