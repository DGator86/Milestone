import { db } from "@/db";
import { goals, crm_opportunities, crm_tasks, crm_opportunity_contacts, crm_opportunity_customers } from "@/db/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { getKillList } from "@/lib/progress";
import type { GoalWithDetails } from "@/lib/types";

async function getOpportunityIdsForContact(userId: string, contactId: string) {
  const [direct, linked] = await Promise.all([
    db
      .select({ id: crm_opportunities.id })
      .from(crm_opportunities)
      .where(and(eq(crm_opportunities.user_id, userId), eq(crm_opportunities.contact_id, contactId))),
    db
      .select({ id: crm_opportunity_contacts.opportunity_id })
      .from(crm_opportunity_contacts)
      .innerJoin(crm_opportunities, eq(crm_opportunities.id, crm_opportunity_contacts.opportunity_id))
      .where(
        and(eq(crm_opportunities.user_id, userId), eq(crm_opportunity_contacts.contact_id, contactId)),
      ),
  ]);
  return [...new Set([...direct.map((row) => row.id), ...linked.map((row) => row.id)])];
}

async function getOpportunityIdsForCustomer(userId: string, customerId: string) {
  const [direct, linked] = await Promise.all([
    db
      .select({ id: crm_opportunities.id })
      .from(crm_opportunities)
      .where(and(eq(crm_opportunities.user_id, userId), eq(crm_opportunities.customer_id, customerId))),
    db
      .select({ id: crm_opportunity_customers.opportunity_id })
      .from(crm_opportunity_customers)
      .innerJoin(crm_opportunities, eq(crm_opportunities.id, crm_opportunity_customers.opportunity_id))
      .where(
        and(
          eq(crm_opportunities.user_id, userId),
          eq(crm_opportunity_customers.customer_id, customerId),
        ),
      ),
  ]);
  return [...new Set([...direct.map((row) => row.id), ...linked.map((row) => row.id)])];
}

function asGoalWithDetails(
  rows: Awaited<ReturnType<typeof fetchGoalsWithMilestones>>
): GoalWithDetails[] {
  return rows.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort((a, b) => a.position - b.position),
  })) as GoalWithDetails[];
}

async function fetchGoalsWithMilestones(
  userId: string,
  whereExtra: ReturnType<typeof eq> | ReturnType<typeof or>
) {
  return db.query.goals.findMany({
    where: and(eq(goals.user_id, userId), eq(goals.status, "active"), whereExtra),
    with: {
      milestones: true,
      groups: true,
      crm_customers: { columns: { id: true, name: true } },
      crm_opportunities: { columns: { id: true, title: true } },
    },
    orderBy: [desc(goals.updated_at)],
  });
}

export async function getRelatedGoalsForCustomer(userId: string, customerId: string) {
  const rows = await fetchGoalsWithMilestones(userId, eq(goals.customer_id, customerId));
  const goalList = asGoalWithDetails(rows);
  return { goals: goalList, killList: getKillList(goalList) };
}

export async function getRelatedGoalsForContact(
  userId: string,
  contactId: string,
  customerId: string | null
) {
  const oppIds = await getOpportunityIdsForContact(userId, contactId);
  const linkFilter =
    customerId && oppIds.length
      ? or(eq(goals.customer_id, customerId), inArray(goals.opportunity_id, oppIds))
      : customerId
        ? eq(goals.customer_id, customerId)
        : oppIds.length
          ? inArray(goals.opportunity_id, oppIds)
          : null;

  if (!linkFilter) return { goals: [] as GoalWithDetails[], killList: [] };

  const rows = await fetchGoalsWithMilestones(userId, linkFilter);
  const goalList = asGoalWithDetails(rows);
  return { goals: goalList, killList: getKillList(goalList) };
}

export async function getOpenOpportunitiesForContact(userId: string, contactId: string) {
  const oppIds = await getOpportunityIdsForContact(userId, contactId);
  if (oppIds.length === 0) return [];

  return db.query.crm_opportunities.findMany({
    where: and(
      eq(crm_opportunities.user_id, userId),
      eq(crm_opportunities.status, "open"),
      inArray(crm_opportunities.id, oppIds),
    ),
    with: { crm_customers: { columns: { id: true, name: true } } },
    orderBy: [desc(crm_opportunities.updated_at)],
  });
}

export async function getOpenOpportunitiesForCustomer(userId: string, customerId: string) {
  const oppIds = await getOpportunityIdsForCustomer(userId, customerId);
  if (oppIds.length === 0) return [];

  return db.query.crm_opportunities.findMany({
    where: and(
      eq(crm_opportunities.user_id, userId),
      eq(crm_opportunities.status, "open"),
      inArray(crm_opportunities.id, oppIds),
    ),
    with: { crm_contacts: { columns: { id: true, first_name: true, last_name: true } } },
    orderBy: [desc(crm_opportunities.updated_at)],
  });
}

export async function getOpenTasksForContact(userId: string, contactId: string) {
  return db.query.crm_tasks.findMany({
    where: and(
      eq(crm_tasks.user_id, userId),
      eq(crm_tasks.contact_id, contactId),
      eq(crm_tasks.done, false)
    ),
    orderBy: [desc(crm_tasks.created_at)],
  });
}

export async function getOpenTasksForCustomer(userId: string, customerId: string) {
  return db.query.crm_tasks.findMany({
    where: and(
      eq(crm_tasks.user_id, userId),
      eq(crm_tasks.customer_id, customerId),
      eq(crm_tasks.done, false)
    ),
    orderBy: [desc(crm_tasks.created_at)],
  });
}

/** Active goals linked to opportunities, grouped by opportunity_id. */
export async function getGoalsByOpportunityIds(
  userId: string,
  opportunityIds: string[],
): Promise<Record<string, GoalWithDetails[]>> {
  if (opportunityIds.length === 0) return {};

  const rows = await db.query.goals.findMany({
    where: and(
      eq(goals.user_id, userId),
      eq(goals.status, "active"),
      inArray(goals.opportunity_id, opportunityIds),
    ),
    with: {
      milestones: true,
      groups: true,
    },
    orderBy: [desc(goals.updated_at)],
  });

  const grouped: Record<string, GoalWithDetails[]> = {};
  for (const row of rows) {
    if (!row.opportunity_id) continue;
    const goal = {
      ...row,
      groups: row.groups!,
      milestones: [...(row.milestones ?? [])].sort((a, b) => a.position - b.position),
    } as GoalWithDetails;
    if (!grouped[row.opportunity_id]) grouped[row.opportunity_id] = [];
    grouped[row.opportunity_id].push(goal);
  }
  return grouped;
}
