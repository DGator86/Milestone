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
  AGENDA_BUCKET_ORDER,
  buildAgendaBuckets,
  type AgendaEntry,
} from "@/lib/agenda";
import type { MilestoneBucket } from "@/lib/milestoneBuckets";
import { buildMailtoLink, isEmailMilestone } from "@/lib/milestoneEmail";
import type { ScheduledMilestone, ScheduledTask } from "@/lib/scheduleAnchor";
import type { CrmTask, GoalWithDetails, TaskType } from "@/lib/types";

const BUCKET_META: Record<MilestoneBucket, { label: string; cls: string }> = {
  overdue: { label: "Overdue", cls: "text-milestone-red" },
  today: { label: "Today", cls: "text-milestone-amber" },
  tomorrow: { label: "Tomorrow", cls: "text-gray-500 dark:text-white/55" },
  week: { label: "This Week", cls: "text-gray-500 dark:text-white/55" },
  later: { label: "Later", cls: "text-gray-500 dark:text-white/55" },
  noDate: { label: "No Date", cls: "text-gray-500 dark:text-white/55" },
};

const ANCHOR_LABEL: Record<string, string> = {
  milestone: "Due date",
  goal: "Goal deadline",
  priority: "Priority",
  task: "Due date",
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

function MilestoneRow({
  item,
  onComplete,
}: {
  item: ScheduledMilestone;
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
    <div className="group flex items-center gap-3 px-4 py-4 active:bg-gray-50/60 dark:active:bg-white/[0.03] transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{item.goal.title}</p>
        {titleEl}
        <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
          {ANCHOR_LABEL[item.anchor.source] ?? "Scheduled"}
        </p>
      </div>
      <button
        onClick={() => onComplete(item.milestone.id, item.goal.id)}
        className="ms-touch-icon ms-row-complete text-gray-300 dark:text-white/25 active:text-milestone-green shrink-0"
        aria-label="Mark done"
      >
        <CheckCircle size={20} />
      </button>
    </div>
  );
}

function TaskRow({
  item,
  onToggle,
}: {
  item: ScheduledTask;
  onToggle: (id: string, done: boolean) => void;
}) {
  const { task } = item;
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
    <div className="group flex items-center gap-3 px-4 py-4 active:bg-gray-50/60 dark:active:bg-white/[0.03] transition-colors">
      <button
        onClick={() => onToggle(task.id, !task.done)}
        className="w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center border-gray-300 active:border-milestone-blue transition-colors touch-manipulation"
        aria-label="Toggle done"
      />
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[task.type]}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">CRM task</p>
        {titleEl}
        <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
          {ANCHOR_LABEL[item.anchor.source] ?? "Scheduled"}
          {item.anchor.source === "priority" ? ` · ${task.priority}` : ""}
        </p>
        {(task.notes || task.crm_customers?.name) && (
          <p className="text-xs text-gray-400 dark:text-white/30 truncate">
            {[task.notes, task.crm_customers?.name].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

function AgendaRow({
  entry,
  onComplete,
  onToggleTask,
}: {
  entry: AgendaEntry;
  onComplete: (milestoneId: string, goalId: string) => void;
  onToggleTask: (id: string, done: boolean) => void;
}) {
  if (entry.kind === "milestone") {
    return <MilestoneRow item={entry.item} onComplete={onComplete} />;
  }
  return <TaskRow item={entry.item} onToggle={onToggleTask} />;
}

export default function AgendaView({
  goals,
  tasks,
  scope = "all",
}: {
  goals: GoalWithDetails[];
  tasks: CrmTask[];
  scope?: "all" | "today";
}) {
  const [isPending, startTransition] = useTransition();

  const grouped = useMemo(() => buildAgendaBuckets(goals, tasks), [goals, tasks]);
  const bucketKeys = scope === "today" ? (["overdue", "today"] as const) : AGENDA_BUCKET_ORDER;
  const hasAny = bucketKeys.some((key) => grouped[key].length > 0);

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  function handleToggleTask(id: string, done: boolean) {
    startTransition(() => toggleTaskDone(id, done));
  }

  if (!hasAny) {
    return (
      <section className="ms-card-app overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-milestone-line dark:border-white/[0.08]">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
            {scope === "today" ? "Today's agenda" : "Agenda"}
          </h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-gray-400 dark:text-white/30">
            {scope === "today" ? "Nothing due today." : "Nothing on your agenda yet."}
          </p>
          <p className="text-xs text-gray-400 dark:text-white/20 mt-1">
            Open milestones and tasks appear here when they have a due date or priority.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-card-app overflow-hidden flex flex-col h-full" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="px-4 py-3 border-b border-milestone-line dark:border-white/[0.08] shrink-0">
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">
          {scope === "today" ? "Today's agenda" : "Agenda"}
        </h2>
      </div>
      <div className="flex-1 xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto">
        <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05]">
          {bucketKeys.map((key) => {
            const items = grouped[key];
            if (items.length === 0) return null;
            const { label, cls } = BUCKET_META[key];
            return (
              <div key={key}>
                <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-white/[0.02]">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cls}`}>
                    {label} · {items.length}
                  </span>
                </div>
                {items.map((entry) => (
                  <AgendaRow
                    key={
                      entry.kind === "milestone"
                        ? `ms-${entry.item.milestone.id}`
                        : `task-${entry.item.task.id}`
                    }
                    entry={entry}
                    onComplete={handleComplete}
                    onToggleTask={handleToggleTask}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
