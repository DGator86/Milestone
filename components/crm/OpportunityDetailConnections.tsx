"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Target, ChevronRight, CheckCircle } from "lucide-react";
import {
  Target,
  ChevronRight,
  CheckCircle,
  Plus,
  X,
  Link2,
} from "lucide-react";
import { completeMilestone } from "@/app/dashboard/actions";
import {
  createOpportunityGoal,
  linkGoalToOpportunity,
  unlinkGoalFromOpportunity,
} from "@/app/opportunities/actions";
import { calcProgress } from "@/lib/progress";
import { getLinkedContacts, getLinkedCustomers } from "@/lib/crm/opportunityLinks";
import { EntityChip } from "./CrmDetailSections";
import type { CrmOpportunity, GoalWithDetails, Group, Milestone, MilestoneStatus } from "@/lib/types";

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

function GoalMilestones({
  goal,
  onUnlink,
}: {
  goal: GoalWithDetails;
  onUnlink?: () => void;
}) {
  const milestones = goal.milestones ?? [];
  const pct = calcProgress(milestones);

  return (
    <div className="rounded-xl border border-milestone-line dark:border-white/[0.08] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/60 dark:bg-white/[0.03]">
        <Link
          href={`/goals/${goal.id}`}
          className="flex items-center gap-2 flex-1 min-w-0 hover:text-milestone-blue transition-colors"
        >
          <Target size={14} className="text-milestone-blue shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{goal.title}</p>
            <p className="text-[11px] text-gray-400 dark:text-white/40">
              {pct}% · {milestones.length} milestones
            </p>
          </div>
          <ChevronRight size={14} className="text-gray-300 dark:text-white/30 shrink-0" />
        </Link>
        {onUnlink && (
          <button
            type="button"
            onClick={onUnlink}
            className="p-1 rounded text-gray-300 dark:text-white/30 hover:text-milestone-red shrink-0"
            aria-label={`Unlink goal "${goal.title}"`}
            title="Unlink goal"
          >
            <X size={14} />
          </button>
        )}
      </div>
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

function GoalActions({
  opportunityId,
  groups,
  linkableGoals,
}: {
  opportunityId: string;
  groups: Group[];
  linkableGoals: Array<{ id: string; title: string; opportunity_id: string | null }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"create" | "link" | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState("");

  const availableGoals = linkableGoals.filter((goal) => goal.opportunity_id !== opportunityId);

  function refresh() {
    router.refresh();
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createOpportunityGoal(opportunityId, formData);
      setMode(null);
      refresh();
    });
  }

  function handleLink() {
    if (!selectedGoalId) return;
    startTransition(async () => {
      await linkGoalToOpportunity(opportunityId, selectedGoalId);
      setMode(null);
      setSelectedGoalId("");
      refresh();
    });
  }

  return (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "create" ? null : "create")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-milestone-blue hover:underline"
        >
          <Plus size={12} />
          Create goal
        </button>
        {availableGoals.length > 0 && (
          <button
            type="button"
            onClick={() => setMode(mode === "link" ? null : "link")}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-milestone-blue hover:underline"
          >
            <Link2 size={12} />
            Link existing goal
          </button>
        )}
      </div>

      {mode === "create" && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-milestone-line dark:border-white/[0.08] p-3 space-y-2"
          style={{ opacity: pending ? 0.7 : 1 }}
        >
          <input
            name="title"
            required
            placeholder="Goal title"
            className="ms-input py-1.5 text-sm"
            autoFocus
          />
          <input
            name="milestone_1"
            required
            placeholder="First milestone"
            className="ms-input py-1.5 text-sm"
          />
          {groups.length > 0 && (
            <select name="group_id" className="ms-input py-1.5 text-sm" defaultValue={groups[0]?.id}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 text-xs font-semibold bg-milestone-blue text-white rounded-lg disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "link" && (
        <div
          className="rounded-xl border border-milestone-line dark:border-white/[0.08] p-3 space-y-2"
          style={{ opacity: pending ? 0.7 : 1 }}
        >
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="ms-input py-1.5 text-sm"
          >
            <option value="">Choose a goal…</option>
            {availableGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
                {goal.opportunity_id ? " (linked elsewhere)" : ""}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLink}
              disabled={pending || !selectedGoalId}
              className="px-3 py-1.5 text-xs font-semibold bg-milestone-blue text-white rounded-lg disabled:opacity-50"
            >
              Link
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OpportunityDetailConnections({
  opportunity,
  linkedGoals,
  groups = [],
  linkableGoals = [],
  customerLabel = "Company",
  contactLabel = "Contact",
}: {
  opportunity: CrmOpportunity;
  linkedGoals: GoalWithDetails[];
  groups?: Group[];
  linkableGoals?: Array<{ id: string; title: string; opportunity_id: string | null }>;
  customerLabel?: string;
  contactLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const linkedCustomers = getLinkedCustomers(opportunity);
  const linkedContacts = getLinkedContacts(opportunity);
  const hasConnections = linkedCustomers.length > 0 || linkedContacts.length > 0;

  function handleUnlink(goalId: string) {
    startTransition(async () => {
      await unlinkGoalFromOpportunity(goalId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2">
          Connections
        </p>
        {hasConnections ? (
          <div className="flex flex-wrap gap-2">
            {linkedCustomers.map((customer) => (
              <EntityChip
                href={`/customers/${opportunity.crm_customers.id}`}
                label={opportunity.crm_customers.name}
                key={customer.id}
                href={`/customers/${customer.id}`}
                label={customer.name}
                icon="building"
              />
            ))}
            {linkedContacts.map((contact) => (
              <EntityChip
                href={`/contacts/${opportunity.crm_contacts.id}`}
                label={`${opportunity.crm_contacts.first_name} ${opportunity.crm_contacts.last_name}`.trim()}
                key={contact.id}
                href={`/contacts/${contact.id}`}
                label={`${contact.first_name} ${contact.last_name}`.trim()}
                icon="user"
                variant="gray"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-white/40">
            No {customerLabel.toLowerCase()} or {contactLabel.toLowerCase()} linked yet. Add them in the edit
            form below.
          </p>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/40 mb-2">
          Goals & milestones
        </p>
        <GoalActions
          opportunityId={opportunity.id}
          groups={groups}
          linkableGoals={linkableGoals}
        />
        {linkedGoals.length > 0 ? (
          <div className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
            {linkedGoals.map((goal) => (
              <GoalMilestones
                key={goal.id}
                goal={goal}
                onUnlink={() => handleUnlink(goal.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-white/40">
            No goals linked yet. Create one above or link an existing goal.
          </p>
        )}
      </div>
    </div>
  );
}
