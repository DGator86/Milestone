import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_opportunities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import {
  DetailSection,
  EntityChip,
  KillListItems,
  GoalListItems,
} from "@/components/crm/CrmDetailSections";
import TaskListInteractive from "@/components/crm/TaskListInteractive";
import ActivityTimeline from "@/components/crm/ActivityTimeline";
import AddNoteForm from "@/components/crm/AddNoteForm";
import CrmQuickActions from "@/components/crm/CrmQuickActions";
import { getSettings } from "@/lib/settings";
import {
  getRelatedGoalsForOpportunity,
  getOpenTasksForOpportunity,
} from "@/lib/crm/related";
import { getTimelineForOpportunity } from "@/lib/crm/timeline";
import {
  ArrowLeft,
  Handshake,
  Building2,
  UserRound,
  Zap,
  Target,
  CheckSquare,
  StickyNote,
  Clock,
} from "lucide-react";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [opp, { terms }] = await Promise.all([
    db.query.crm_opportunities.findFirst({
      where: and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)),
      with: {
        crm_customers: true,
        crm_contacts: true,
        crm_flows: true,
      },
    }),
    getSettings(userId),
  ]);

  if (!opp) notFound();

  const [{ goals, killList }, tasks] = await Promise.all([
    getRelatedGoalsForOpportunity(userId, id),
    getOpenTasksForOpportunity(userId, id),
  ]);

  const goalIds = goals.map((g) => g.id);
  const fullTimeline = await getTimelineForOpportunity(userId, id, goalIds);

  const value = opp.value != null ? parseFloat(opp.value) : null;
  const contactName = opp.crm_contacts
    ? `${opp.crm_contacts.first_name} ${opp.crm_contacts.last_name}`
    : undefined;

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} />
          All {terms.opportunities}
        </Link>

        <div className="bg-white rounded-xl shadow-card border border-milestone-line p-5 md:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-milestone-green-dim flex items-center justify-center shrink-0">
              <Handshake size={24} className="text-milestone-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {opp.stage}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-milestone-blue-dim text-milestone-blue capitalize">
                  {opp.status}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{opp.title}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                {opp.crm_contacts && (
                  <EntityChip
                    href={`/contacts/${opp.crm_contacts.id}`}
                    label={`${opp.crm_contacts.first_name} ${opp.crm_contacts.last_name}`}
                    icon={UserRound}
                    variant="gray"
                  />
                )}
                {opp.crm_customers && (
                  <EntityChip
                    href={`/customers/${opp.crm_customers.id}`}
                    label={opp.crm_customers.name}
                    icon={Building2}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                {value != null && (
                  <span className="font-bold text-milestone-blue text-sm tabular-nums">
                    ${value.toLocaleString()}
                  </span>
                )}
                {opp.close_date && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Close {new Date(opp.close_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <CrmQuickActions
            customerId={opp.customer_id ?? undefined}
            contactId={opp.contact_id ?? undefined}
            contactName={contactName}
            customerName={opp.crm_customers?.name}
          />

          {opp.notes && (
            <div className="pt-4 border-t border-milestone-line">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <StickyNote size={12} /> Notes
              </p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.notes}</p>
            </div>
          )}
        </div>

        <DetailSection title="Milestones to Kill" count={killList.length} icon={Zap}>
          <KillListItems items={killList} />
        </DetailSection>

        <DetailSection title="Linked Goals" count={goals.length} icon={Target}>
          <GoalListItems goals={goals} />
        </DetailSection>

        <DetailSection title="Open Tasks" count={tasks.length} icon={CheckSquare}>
          <TaskListInteractive tasks={tasks} />
        </DetailSection>

        <DetailSection title="Activity" count={fullTimeline.length} icon={Clock}>
          <AddNoteForm opportunityId={id} customerId={opp.customer_id ?? undefined} contactId={opp.contact_id ?? undefined} />
          <div className="mt-4">
            <ActivityTimeline entries={fullTimeline} />
          </div>
        </DetailSection>
      </div>
    </AppShell>
  );
}
