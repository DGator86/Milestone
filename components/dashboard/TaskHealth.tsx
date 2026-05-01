import { AlertCircle, AlertTriangle, Clock, CheckCircle, ChevronRight, HelpCircle } from "lucide-react";
import { getTaskHealth } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

export default function TaskHealth({ goals }: { goals: GoalWithDetails[] }) {
  const { stuck, needsAttention, waiting, onTrack } = getTaskHealth(goals);

  const rows = [
    {
      icon: <AlertCircle size={20} className="text-milestone-red" />,
      count: stuck.length,
      label: "Stuck",
      labelColor: "text-milestone-red",
      sample: stuck.slice(0, 2).map((g) => g.title),
    },
    {
      icon: <AlertTriangle size={20} className="text-milestone-amber" />,
      count: needsAttention.length,
      label: "Needs Attention",
      labelColor: "text-milestone-amber",
      sample: needsAttention.slice(0, 2).map((g) => g.title),
    },
    {
      icon: <Clock size={20} className="text-milestone-blue" />,
      count: waiting.length,
      label: "Waiting",
      labelColor: "text-milestone-blue",
      sample: waiting.slice(0, 2).map((g) => g.title),
    },
    {
      icon: <CheckCircle size={20} className="text-milestone-green" />,
      count: onTrack.length,
      label: "On Track",
      labelColor: "text-milestone-green",
      sample: onTrack.length > 0 ? ["All good"] : [],
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-milestone-line p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          B. Current Task Health
        </h2>
        <HelpCircle size={14} className="text-gray-400" />
      </div>

      <div className="space-y-3">
        {rows.map(({ icon, count, label, labelColor, sample }) => (
          <div
            key={label}
            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            {icon}
            <span className="text-2xl font-bold text-gray-900 w-8 shrink-0">{count}</span>
            <span className={`text-sm font-semibold w-32 shrink-0 ${labelColor}`}>{label}</span>
            <span className="text-sm text-gray-400 flex-1 truncate">
              {sample.length > 0 ? sample.join(" · ") : "—"}
            </span>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
