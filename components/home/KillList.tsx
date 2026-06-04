"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  Plus,
  X,
  Trash2,
  ListChecks,
  CheckCircle,
} from "lucide-react";
import { groupTasks } from "@/lib/tasks";
import { createTask, toggleTaskDone, deleteTask } from "@/app/dashboard/task-actions";
import { completeMilestone } from "@/app/dashboard/actions";
import type { CrmTask, TaskType, TaskPriority, CrmCustomer } from "@/lib/types";
import type { GoalWithDetails, Milestone } from "@/lib/types";

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
  meeting: "bg-purple-100 text-purple-600",
  task: "bg-milestone-amber-dim text-milestone-amber",
  document: "bg-gray-100 text-gray-500",
};

const PRIORITY_META: Record<TaskPriority, string> = {
  critical: "text-milestone-red",
  high: "text-milestone-amber",
  medium: "text-gray-400",
  low: "text-gray-300",
};

const INPUT =
  "w-full px-3 py-2 text-sm border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue/20 focus:border-milestone-blue bg-white";

type MilestoneHealth = "critical" | "at_risk" | "on_track" | "none";

interface MilestoneWithGoal {
  milestone: Milestone;
  goalId: string;
  goalTitle: string;
  health: MilestoneHealth;
  daysUntil: number | null;
}

function getMilestoneHealth(dueDate: string | null): { health: MilestoneHealth; daysUntil: number | null } {
  if (!dueDate) return { health: "none", daysUntil: null };
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntil = Math.round((date.getTime() - t0.getTime()) / 86400000);
  if (daysUntil < 0) return { health: "critical", daysUntil };
  if (daysUntil <= 7) return { health: "at_risk", daysUntil };
  return { health: "on_track", daysUntil };
}

function fmtMilestoneDate(daysUntil: number | null): { label: string; color: string } {
  if (daysUntil === null) return { label: "No date", color: "text-gray-300" };
  if (daysUntil < 0) return { label: `${Math.abs(daysUntil)}d overdue`, color: "text-milestone-red" };
  if (daysUntil === 0) return { label: "Today", color: "text-milestone-amber" };
  if (daysUntil === 1) return { label: "Tomorrow", color: "text-gray-400" };
  return { label: `${daysUntil}d left`, color: "text-gray-400" };
}

const HEALTH_BORDER: Record<MilestoneHealth, string> = {
  critical: "border-l-milestone-red",
  at_risk: "border-l-milestone-amber",
  on_track: "border-l-milestone-green",
  none: "border-l-gray-200",
};

function MilestoneGoalRow({
  item,
  onComplete,
}: {
  item: MilestoneWithGoal;
  onComplete: (milestoneId: string, goalId: string) => void;
}) {
  const { label, color } = fmtMilestoneDate(item.daysUntil);
  return (
    <div className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors border-l-[3px] ${HEALTH_BORDER[item.health]}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug truncate text-gray-900">{item.milestone.title}</p>
        <p className="text-xs text-gray-400 truncate">{item.goalTitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-[11px] font-semibold ${color}`}>{label}</p>
      </div>
      <button
        onClick={() => onComplete(item.milestone.id, item.goalId)}
        className="text-gray-200 hover:text-milestone-green transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Complete milestone"
      >
        <CheckCircle size={16} />
      </button>
    </div>
  );
}

function fmtDue(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  const date = new Date(y, m - 1, day);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d0.getTime() - t0.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: CrmTask;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = TYPE_ICON[task.type];
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
      <button
        onClick={() => onToggle(task.id, !task.done)}
        className={`w-[18px] h-[18px] rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
          task.done
            ? "bg-milestone-blue border-milestone-blue"
            : "border-gray-300 hover:border-milestone-blue"
        }`}
        aria-label="Toggle done"
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.2 2.2L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_TINT[task.type]}`}>
        <Icon size={15} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug truncate ${task.done ? "text-gray-300 line-through" : "text-gray-900"}`}>
          {task.title}
        </p>
        {task.crm_customers?.name && (
          <p className="text-xs text-gray-400 truncate">{task.crm_customers.name}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-[11px] text-gray-400">{fmtDue(task.due_date)}</p>
        <p className={`text-[11px] font-bold capitalize ${PRIORITY_META[task.priority]}`}>
          {task.priority}
        </p>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-200 hover:text-milestone-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Delete task"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function TaskGroup({
  label,
  tone,
  tasks,
  onToggle,
  onDelete,
}: {
  label: string;
  tone: string;
  tasks: CrmTask[];
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tone}`}>
          {tasks.length}
        </span>
      </div>
      <div className="divide-y divide-milestone-line/70">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

const HEALTH_ORDER: Record<MilestoneHealth, number> = { critical: 0, at_risk: 1, on_track: 2, none: 3 };

interface Props {
  tasks: CrmTask[];
  customers: Pick<CrmCustomer, "id" | "name">[];
  goals: GoalWithDetails[];
}

export default function KillList({ tasks, customers, goals }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const openCount = tasks.filter((t) => !t.done).length;

  const goalMilestones = useMemo((): MilestoneWithGoal[] => {
    const items: MilestoneWithGoal[] = [];
    for (const goal of goals) {
      if (goal.status !== "active") continue;
      const inProgress = goal.milestones?.find((m) => m.status === "in_progress");
      if (!inProgress) continue;
      const { health, daysUntil } = getMilestoneHealth(inProgress.due_date);
      items.push({ milestone: inProgress, goalId: goal.id, goalTitle: goal.title, health, daysUntil });
    }
    items.sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]);
    return items;
  }, [goals]);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      await createTask(formData);
      form.reset();
      setShowForm(false);
    });
  }

  function handleToggle(id: string, done: boolean) {
    startTransition(() => toggleTaskDone(id, done));
  }

  function handleDelete(id: string) {
    startTransition(() => deleteTask(id));
  }

  function handleComplete(milestoneId: string, goalId: string) {
    startTransition(() => completeMilestone(milestoneId, goalId));
  }

  return (
    <section className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden flex flex-col" style={{ opacity: isPending ? 0.7 : 1 }}>
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-milestone-line">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Kill List</h2>
          <p className="text-xs text-gray-400 mt-0.5">{openCount} prioritized actions</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-milestone-blue hover:bg-milestone-blue-dim px-2.5 py-1.5 rounded-lg transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="p-4 space-y-3 border-b border-milestone-line bg-gray-50/50 animate-fade-up">
          <input name="title" required autoFocus placeholder="What needs doing?" className={INPUT} />
          <div className="grid grid-cols-2 gap-2">
            <select name="type" className={INPUT} defaultValue="call">
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="document">Document</option>
            </select>
            <select name="priority" className={INPUT} defaultValue="medium">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="due_date" type="date" className={INPUT} />
            <select name="customer_id" className={INPUT} defaultValue="">
              <option value="">No company</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-milestone-blue text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Add to Kill List
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)]">
        {goalMilestones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Goal Steps</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-milestone-blue-dim text-milestone-blue">
                {goalMilestones.length}
              </span>
            </div>
            <div className="divide-y divide-milestone-line/70">
              {goalMilestones.map((item) => (
                <MilestoneGoalRow key={item.milestone.id} item={item} onComplete={handleComplete} />
              ))}
            </div>
          </div>
        )}

        {goalMilestones.length > 0 && openCount > 0 && (
          <div className="mx-4 my-2 border-t border-milestone-line/50" />
        )}

        {openCount === 0 && goalMilestones.length === 0 ? (
          <div className="p-12 text-center">
            <ListChecks size={34} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">Nothing on the list.</p>
            <p className="text-xs text-gray-300 mt-1">You&apos;re all caught up.</p>
          </div>
        ) : openCount > 0 ? (
          <>
            <TaskGroup label="Overdue" tone="bg-milestone-red-dim text-milestone-red" tasks={groups.overdue} onToggle={handleToggle} onDelete={handleDelete} />
            <TaskGroup label="Today" tone="bg-milestone-blue-dim text-milestone-blue" tasks={groups.today} onToggle={handleToggle} onDelete={handleDelete} />
            <TaskGroup label="Upcoming This Week" tone="bg-gray-100 text-gray-500" tasks={groups.upcoming} onToggle={handleToggle} onDelete={handleDelete} />
            <TaskGroup label="Later" tone="bg-gray-100 text-gray-400" tasks={groups.later} onToggle={handleToggle} onDelete={handleDelete} />
          </>
        ) : null}
      </div>
    </section>
  );
}
