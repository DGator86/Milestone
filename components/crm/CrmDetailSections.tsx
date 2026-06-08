import Link from "next/link";
import {
  Building2,
  Handshake,
  Target,
  Zap,
  CheckSquare,
  ChevronRight,
  UserRound,
} from "lucide-react";
import type { GoalWithDetails, Milestone } from "@/lib/types";

export function DetailSection({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count?: number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
      <div className="px-4 py-3 border-b border-milestone-line bg-gray-50/60 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-milestone-blue shrink-0" />}
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h2>
        {count != null && (
          <span className="text-[10px] font-bold text-gray-300 tabular-nums">{count}</span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EntityChip({
  href,
  label,
  icon: Icon,
  variant = "blue",
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  variant?: "blue" | "green" | "gray";
}) {
  const styles = {
    blue: "text-milestone-blue bg-milestone-blue-dim hover:bg-blue-100",
    green: "text-milestone-green bg-milestone-green-dim hover:bg-green-100",
    gray: "text-gray-600 bg-gray-100 hover:bg-gray-200",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-colors ${styles[variant]}`}
    >
      <Icon size={13} />
      {label}
    </Link>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 text-center py-4">{children}</p>;
}

export function KillListItems({
  items,
}: {
  items: Array<{ goal: GoalWithDetails; milestone: Milestone }>;
}) {
  if (!items.length) {
    return <EmptyHint>No active milestones to work right now.</EmptyHint>;
  }
  return (
    <div className="space-y-2">
      {items.map(({ goal, milestone }) => (
        <Link
          key={`${goal.id}-${milestone.id}`}
          href={`/goals/${goal.id}`}
          className="flex items-start gap-3 rounded-xl border border-milestone-line px-3.5 py-3 hover:bg-milestone-blue-dim/30 transition-colors group"
        >
          <div className="w-6 h-6 rounded-full border-2 border-milestone-blue flex items-center justify-center shrink-0 mt-0.5">
            <Zap size={11} className="text-milestone-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-milestone-blue transition-colors">
              {milestone.title}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{goal.title}</p>
          </div>
          <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1 group-hover:text-milestone-blue" />
        </Link>
      ))}
    </div>
  );
}

export function GoalListItems({ goals }: { goals: GoalWithDetails[] }) {
  if (!goals.length) {
    return <EmptyHint>No active goals linked yet.</EmptyHint>;
  }
  return (
    <div className="space-y-2">
      {goals.map((goal) => {
        const completed = goal.milestones.filter((m) => m.status === "completed").length;
        const total = goal.milestones.length;
        const pct = total ? Math.round((completed / total) * 100) : 0;
        return (
          <Link
            key={goal.id}
            href={`/goals/${goal.id}`}
            className="flex items-center gap-3 rounded-xl border border-milestone-line px-3.5 py-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
              <Target size={14} className="text-milestone-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-milestone-blue transition-colors">
                {goal.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {completed}/{total} milestones · {pct}%
              </p>
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0 group-hover:text-milestone-blue" />
          </Link>
        );
      })}
    </div>
  );
}

export function OpportunityListItems({
  opportunities,
  showContact = false,
  showCompany = false,
}: {
  opportunities: Array<{
    id: string;
    title: string;
    stage: string;
    value: string | null;
    crm_customers?: { id: string; name: string } | null;
    crm_contacts?: { id: string; first_name: string; last_name: string } | null;
  }>;
  showContact?: boolean;
  showCompany?: boolean;
}) {
  if (!opportunities.length) {
    return <EmptyHint>No open opportunities.</EmptyHint>;
  }
  return (
    <div className="space-y-2">
      {opportunities.map((opp) => (
        <Link
          key={opp.id}
          href={`/opportunities/${opp.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-milestone-line px-3.5 py-3 hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-milestone-green-dim flex items-center justify-center shrink-0">
              <Handshake size={14} className="text-milestone-green" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-milestone-blue transition-colors">
                {opp.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {opp.stage}
                </span>
                {showCompany && opp.crm_customers && (
                  <Link
                    href={`/customers/${opp.crm_customers.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-milestone-blue flex items-center gap-0.5 hover:underline"
                  >
                    <Building2 size={10} />
                    {opp.crm_customers.name}
                  </Link>
                )}
                {showContact && opp.crm_contacts && (
                  <Link
                    href={`/contacts/${opp.crm_contacts.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-gray-500 flex items-center gap-0.5 hover:text-milestone-blue hover:underline"
                  >
                    <UserRound size={10} />
                    {opp.crm_contacts.first_name} {opp.crm_contacts.last_name}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {opp.value != null && (
            <span className="text-xs font-bold text-milestone-blue shrink-0 tabular-nums">
              ${parseFloat(opp.value).toLocaleString()}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function TaskListItems({
  tasks,
}: {
  tasks: Array<{ id: string; title: string; priority: string; due_date: string | null }>;
}) {
  if (!tasks.length) {
    return <EmptyHint>No open tasks.</EmptyHint>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 rounded-xl border border-milestone-line px-3.5 py-3"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <CheckSquare size={14} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">
              {task.priority} priority
              {task.due_date &&
                ` · Due ${new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ContactListItems({
  contacts,
}: {
  contacts: Array<{ id: string; first_name: string; last_name: string; title: string | null }>;
}) {
  if (!contacts.length) {
    return <EmptyHint>No contacts linked.</EmptyHint>;
  }
  return (
    <div className="space-y-2">
      {contacts.map((ct) => {
        const initials = `${ct.first_name[0]}${ct.last_name[0]}`.toUpperCase();
        return (
          <Link
            key={ct.id}
            href={`/contacts/${ct.id}`}
            className="flex items-center gap-3 rounded-xl border border-milestone-line px-3.5 py-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-milestone-blue flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-milestone-blue transition-colors">
                {ct.first_name} {ct.last_name}
              </p>
              {ct.title && <p className="text-xs text-gray-400 truncate">{ct.title}</p>}
            </div>
            <ChevronRight size={14} className="text-gray-300 shrink-0 group-hover:text-milestone-blue" />
          </Link>
        );
      })}
    </div>
  );
}
