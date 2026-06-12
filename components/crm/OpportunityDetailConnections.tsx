"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, UserRound, Target, ChevronRight, CheckCircle } from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import { calcProgress } from "@/lib/progress";
import { EntityChip } from "./CrmDetailSections";
import type { CrmOpportunity, GoalWithDetails, Milestone, MilestoneStatus } from "@/lib/types";

const MILESTONE_STATUS: Record<MilestoneStatus, string> = {
  upcoming: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/55",
  in_progress: "bg-milestone-blue-dim text-milestone-blue",
  waiting: "bg-blue-50 dark:bg-blue-900/20 text-blue-500",
  stuck: "bg-milestone-red-dim text-milestone-red",
  completed: "bg-milestone-green-dim text-milestone-green line-through",
};

function MilestoneRow({
  milestone,
  goalId,
  index,
}: {
  milestone: Milestone;
  goalId: string;
  index: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const statusCls = MILESTONE_STATUS[milestone.status] ?? MILESTONE_STATUS.upcoming;

  function handleComplete() {
    if (milestone.status === "completed") return;
    startTransition(async () => {
      await completeMilestone(milestone.id, goalId);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-white/[0.03] ${pending ? "opacity-60" : ""}`}
    >
      <span className="text-[10px] font-bold text-gray-400 dark:text-white/35 w-4 shrink-0 tabular-nums">
        {index + 1}
      </span>
      <p
        className={`flex-1 text-sm min-w-0 truncate ${
          milestone.status === "completed"
            ? "text-gray-400 dark:text-white/35 line-through"
            : "text-gray-800 dark:text-white/90"
        }`}
      >
        {milestone.title}
      </p>
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 capitalize ${statusCls}`}>
        {milestone.status.replace("_", " ")}
      </span>
      {milestone.status !== "completed" && (
        <button
          type="button"
          onClick={handleComplete}
          className="p-1 rounded text-gray-300 dark:text-white/30 hover:text-milestone-green shrink-0"
          aria-label={`Mark "${milestone.title}" done`}
          title="Mark done"
        >
          <CheckCircle size={14} />
        </button>
      )}
    </div>
  );
}

function GoalMilestones({ goal }: { goal: GoalWithDetails }) {
  const milestones = goal.milestones ?? [];
  const pct = calcProgress(milestones);

  return (
    <div className="rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden">
      <Link
        href={`/goals/${goal.id}`}
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/60 dark:bg-white/[0.03] hover:bg-milestone-blue-dim/30 transition-colors"
      >
        <Target size={14} className="text-milestone-blue shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{goal.title}</p>
          <p className="text-[11px] text-gray-400 dark:text-white/40">{pct}% · {milestones.length} milestones</p>
        </div>
        <ChevronRight size={14} className="text-gray-300 dark:text-white/30 shrink-0" />
      </Link>
      {milestones.length > 0 ? (
        <div className="divide-y divide-milestone-line/60 dark:divide-white/[0.05] px-1">
          {milestones.map((ms, i) => (
            <MilestoneRow key={ms.id} milestone={ms} goalId={goal.id} index={i} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-white/40 px-3 py-3">No milestones on this goal yet.</p>
      )}
    </div>
  );
}

export default function OpportunityDetailConnections({
  opportunity,
  linkedGoals,
  customerLabel = "Company",
  contactLabel = "Contact",
}: {
  opportunity: CrmOpportunity;
  linkedGoals: GoalWithDetails[];
  customerLabel?: string;
  contactLabel?: string;
}) {
  const hasConnections = opportunity.crm_customers || opportunity.crm_contacts;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2">
          Connections
        </p>
        {hasConnections ? (
          <div className="flex flex-wrap gap-2">
            {opportunity.crm_customers && (
              <EntityChip
                href={`/customers/${opportunity.crm_customers.id}`}
                label={opportunity.crm_customers.name}
                icon={Building2}
              />
            )}
            {opportunity.crm_contacts && (
              <EntityChip
                href={`/contacts/${opportunity.crm_contacts.id}`}
                label={`${opportunity.crm_contacts.first_name} ${opportunity.crm_contacts.last_name}`.trim()}
                icon={UserRound}
                variant="gray"
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-white/40">
            No {customerLabel.toLowerCase()} or {contactLabel.toLowerCase()} linked yet. Add them in the edit form below.
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2">
          Goals & milestones
        </p>
        {linkedGoals.length > 0 ? (
          <div className="space-y-3">
            {linkedGoals.map((goal) => (
              <GoalMilestones key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-white/40">
            No goals linked to this opportunity. Connect a goal from the goal detail page or create one from the dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
