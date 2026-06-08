"use client";

import { useTransition } from "react";
import { CheckSquare, Square } from "lucide-react";
import { toggleTaskDone } from "@/app/dashboard/task-actions";

export default function TaskListInteractive({
  tasks,
  emptyLabel = "No open tasks.",
}: {
  tasks: Array<{ id: string; title: string; priority: string; due_date: string | null }>;
  emptyLabel?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (!tasks.length) {
    return <p className="text-sm text-gray-400 text-center py-4">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2" style={{ opacity: pending ? 0.7 : 1 }}>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 rounded-xl border border-milestone-line px-3.5 py-3"
        >
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await toggleTaskDone(task.id, true);
              })
            }
            className="text-gray-400 hover:text-milestone-green transition-colors shrink-0"
            aria-label="Mark task done"
          >
            <Square size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {task.priority} priority
              {task.due_date &&
                ` · Due ${new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </p>
          </div>
          <CheckSquare size={14} className="text-gray-200 shrink-0" />
        </div>
      ))}
    </div>
  );
}
