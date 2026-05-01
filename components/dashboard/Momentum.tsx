import { CheckCircle, Flag, TrendingUp, HelpCircle } from "lucide-react";
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

  // Week streak: days with at least one milestone completed in last 7 days
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
  const todayStr = new Date().toDateString();
  const checkDate = new Date();
  while (activeDays.has(checkDate.toDateString()) || checkDate.toDateString() === todayStr) {
    if (activeDays.has(checkDate.toDateString())) streak++;
    else break;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-milestone-line p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          C. Streak / Accomplishment
        </h2>
        <HelpCircle size={14} className="text-gray-400" />
      </div>

      <div className="flex gap-6">
        {/* Streak ring */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#F8B400"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(streak / 30, 1) * 251} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl">🔥</span>
              <span className="text-xl font-bold text-gray-900 leading-none">{streak}</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-600 mt-1">Day Streak</p>
          <p className="text-xs text-gray-400">Keep it going!</p>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-milestone-green" />
            <div>
              <span className="text-xl font-bold text-gray-900">{goalsAdvancedToday}</span>
              <span className="text-sm text-gray-500 ml-2">Goals advanced today</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Flag size={18} className="text-milestone-blue" />
            <div>
              <span className="text-xl font-bold text-gray-900">{milestonesCompletedToday}</span>
              <span className="text-sm text-gray-500 ml-2">Milestones completed today</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp size={18} className="text-milestone-green" />
            <div>
              <span className="text-xl font-bold text-milestone-green">+12%</span>
              <span className="text-sm text-gray-500 ml-2">vs last week</span>
            </div>
          </div>

          {/* Week dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {weekDays.map((day, i) => {
              const isActive = activeDays.has(day.toDateString());
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-milestone-green"
                        : isToday
                        ? "border-2 border-milestone-green bg-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{dayLabels[day.getDay() === 0 ? 6 : day.getDay() - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
