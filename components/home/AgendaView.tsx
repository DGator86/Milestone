"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import { toggleTaskDone } from "@/app/dashboard/task-actions";
import {
  groupOpenMilestones,
  type MilestoneBucket,
  type OpenMilestoneItem,
} from "@/lib/milestoneBuckets";
import { groupTasks } from "@/lib/tasks";
import { buildMailtoLink, isEmailMilestone } from "@/lib/milestoneEmail";
import type { CrmTask, GoalWithDetails, TaskType } from "@/lib/types";

/** Buckets shown in agenda — today-relevant first; undated next steps land in Today. */
const AGENDA_BUCKETS: MilestoneBucket[] = ["overdue", "today", "tomorrow", "week", "later"];

const BUCKET_META: Record<MilestoneBucket, { label: string; cls: string }> = {
  overdue: { label: "Overdue", cls: "text-milestone-red" },
  today: { label: "Today", cls: "text-milestone-amber" },
  tomorrow: { label: "Tomorrow", cls: "text-gray-500 dark:text-white/40" },
  week: { label: "This Week", cls: "text-gray-500 dark:text-white/40" },
  later: { label: "Later", cls: "text-gray-400 dark:text-white/30" },
  noDate: { label: "No Date", cls: "text-gray-300 dark:text-white/20" },
};

const TYPE_ICON: Record<TaskType, React.ComponentType<{ size?: number; className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: Users,
  document: FileText,
};

const TYPE_TINT: Record<TaskType, string> = {
  call: "bg-milestone-green-dim text-milestone-green",
  email: "bg-milestone-blue-dim text-milestone-blue",
  meeting: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  task: "bg-milestone-amber-dim text-milestone-amber",
  document: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50",
};

type AgendaEntry =
  | { kind: "milestone"; item: OpenMilestoneItem }
  | { kind: "task"; task: CrmTask; bucket: MilestoneBucket };

function taskBucket(
  task: CrmTask,
  groups: ReturnType<typeof groupTasks>,
): MilestoneBucket | null {
  if (groups.overdue.includes(task)) return "overdue";
  if (groups.today.includes(task)) return "today";
  if (groups.upcoming.includes(task)) {
    if (!task.due_date) return "later";
    const today = new Date();
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const [y, m, d] = task.due_date.split("-").map(Number);
    const due = new Date(y, m - 1, d);
    const daysUntil = Math.round((due.getTime() - t0.getTime()) / 86400000);
    if (daysUntil === 1) return "tomorrow";
    return "week";
  }
  return null;
}

function MilestoneRow({
  item,
  onComplete,
}: {
  item: OpenMilestoneItem;
  onComplete: (milestoneId: string, goalId: string) => void;
}) {
  const mailto = isEmailMilestone(item.milestone.title)
    ? buildMailtoLink(item.milestone.title, { goal: item.goal })
    : null;

  const titleEl = mailto ? (
    <a
      href={mailto}
      className="text-sm font-semibold text-milestone-blue leading-snug truncate block hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {item.milestone.title}
    </a>
  ) : (
    <Link
      href={`/goals/${item.goal.id}`}
      className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate block hover:text-milestone-blue"
    >
      {item.milestone.title}
    </Link>
  );

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{item.goal.title}</p>
        {titleEl}
      </div>
      <button
        onClick={() => onComplete(item.milestone.id, item.goal.id)}
        className="shrink-0 text-gray-200 dark:text-white/20 hover:text-milestone-green transition-colors p-0.5"
        aria-label="Mark done"
      >
        <CheckCircle size={18} />
      </button>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
}: {
  task: CrmTask;
  onToggle: (id: string, done: boolean) => void;
}) {
  const Icon = TYPE_ICON[task.type];
  const titleEl =
    task.type === "email" ? (
      <a
        href={buildMailtoLink(task.title) ?? `mailto:?subject=${encodeURIComponent(task.title)}`}
        className="text-sm font-semibold text-milestone-blue leading-snug truncate block hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </a>
    ) : (
      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate">
        {task.title}
      </p>
    );

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
      <button
        onClick={() => onToggle(task.id, !task.done)}
        className="w-[18px] h-[18px] rounded-md border-2 shrink-0 flex items-center justify-center border-gray-300 hover:border-milestone-blue transition-colors"
        aria-label="Toggle done"
      />
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[task.type]}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">CRM task</p>
        {titleEl}
        {(task.notes || task.crm_customers?.name) && (
          <p className="text-xs text-gray-400 dark:text-white/30 truncate">
            {[task.notes, task.crm_customers?.name].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AgendaView({
  goals,
  tasks,
}: {
  goals: GoalWithDetails[];
  tasks: CrmTask[];
}) {
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const milestoneGroups = groupOpenMilestones(goals);
    const taskGroups = groupTasks(tasks);

    const map: Record<MilestoneBucket, AgendaEntry[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      week: [],
      later: [],
      noDate: [],
    };

    for (const bucket of AGENDA_BUCKETS) {
      for (const item of milestoneGroups[bucket]) {
        map[bucket].push({ kind: "milestone", item });
      }
    }

    // Undated next milestones are today's actionable work.
    for (const item of milestoneGroups.noDate) {
      map.today.push({ kind: "milestone", item });
    }

    for (const task of tasks) {
      if (task.done) continue;
      const bucket = taskBucket(task, taskGroups);
      if (bucket && AGENDA_BUCKETS.includes(bucket)) {
        map[bucket].push({ kind: "task", task, bucket });
      }
    }

    return map;
  }, [goals, tasks]);

  const hasAny = AGENDA_BUCKETS.some((k) => grouped[k].length > 0);

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  function handleToggleTask(id: string, done: boolean) {
    startTransition(() => toggleTaskDone(id, done));
  }

  if (!hasAny) {
    return (
      <div className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card border border-milestone-line dark:border-white/[0.08] p-10 text-center">
        <p className="text-sm text-gray-400 dark:text-white/30">Nothing scheduled for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ opacity: isPending ? 0.7 : 1 }}>
      {AGENDA_BUCKETS.map((key) => {
        const items = grouped[key];
        if (items.length === 0) return null;
        const { label, cls } = BUCKET_META[key];
        return (
          <div
            key={key}
            className="bg-white dark:bg-[#0B1929] rounded-2xl shadow-card border border-milestone-line dark:border-white/[0.08] overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-milestone-line dark:border-white/[0.08]">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${cls}`}>
                {label} · {items.length}
              </span>
            </div>
            <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
              {items.map((entry) =>
                entry.kind === "milestone" ? (
                  <MilestoneRow
                    key={`ms-${entry.item.milestone.id}`}
                    item={entry.item}
                    onComplete={handleComplete}
                  />
                ) : (
                  <TaskRow
                    key={`task-${entry.task.id}`}
                    task={entry.task}
                    onToggle={handleToggleTask}
                  />
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
