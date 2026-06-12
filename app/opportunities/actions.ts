"use server";

import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import {
  crm_opportunities,
  goals,
  milestones,
  activity_log,
  groups,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { OpportunityStatus } from "@/lib/types";
import { getSettings } from "@/lib/settings";
import { collectCustomValues } from "@/lib/customFields";
import { revalidateCrmEntityPaths } from "@/lib/crm/revalidateEntity";
import {
  resolveOwnedContactIds,
  resolveOwnedCustomerIds,
  syncOpportunityLinks,
} from "@/lib/crm/opportunityLinks";

function stageToStatus(stage: string): OpportunityStatus {
  if (stage === "Won") return "won";
  if (stage === "Lost") return "lost";
  return "open";
}

async function getDefaultGroupId(userId: string) {
  const group = await db.query.groups.findFirst({
    where: eq(groups.user_id, userId),
    orderBy: [asc(groups.sort_order)],
  });
  return group?.id ?? null;
}

export async function createOpportunity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const valueStr = formData.get("value") as string;
  const value = valueStr ? parseFloat(valueStr) : null;
  const stage = (formData.get("stage") as string) || "Lead";

  const customerIds = await resolveOwnedCustomerIds(formData, userId);
  const contactIds = await resolveOwnedContactIds(formData, userId, customerIds);
  const customerId = customerIds[0] ?? null;
  const contactId = contactIds[0] ?? null;

  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.opportunity);

  const [row] = await db
    .insert(crm_opportunities)
    .values({
      user_id: userId,
      title,
      customer_id: customerId,
      contact_id: contactId,
      flow_id: (formData.get("flow_id") as string) || null,
      value: value !== null && !isNaN(value) ? String(value) : null,
      stage,
      status: stageToStatus(stage),
      close_date: (formData.get("close_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
      custom,
    })
    .returning({ id: crm_opportunities.id });

  if (!row) return;

  await syncOpportunityLinks(row.id, customerIds, contactIds);

  revalidatePath("/opportunities");
  revalidateCrmEntityPaths({ contactId, customerId });
}

export async function deleteOpportunity(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db
    .delete(crm_opportunities)
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
  revalidatePath("/contacts");
  revalidatePath("/customers");
}

export async function updateOpportunity(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const valueStr = formData.get("value") as string;
  const value = valueStr ? parseFloat(valueStr) : null;
  const stage = (formData.get("stage") as string) || "Lead";

  const customerIds = await resolveOwnedCustomerIds(formData, userId);
  const contactIds = await resolveOwnedContactIds(formData, userId, customerIds);
  const customerId = customerIds[0] ?? null;
  const contactId = contactIds[0] ?? null;

  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.opportunity);

  await db
    .update(crm_opportunities)
    .set({
      title,
      customer_id: customerId,
      contact_id: contactId,
      flow_id: (formData.get("flow_id") as string) || null,
      value: value !== null && !isNaN(value) ? String(value) : null,
      stage,
      status: stageToStatus(stage),
      close_date: (formData.get("close_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
      custom,
    })
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  await syncOpportunityLinks(id, customerIds, contactIds);

  revalidatePath("/opportunities");
  revalidateCrmEntityPaths({ contactId, customerId });
}

export async function moveOpportunity(id: string, stage: string) {
  const trimmed = stage.trim();
  if (!trimmed) return;

  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db
    .update(crm_opportunities)
    .set({ stage: trimmed, status: stageToStatus(trimmed) })
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
}

export async function createOpportunityGoal(opportunityId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const title = (formData.get("title") as string)?.trim();
  const milestoneTitle = (formData.get("milestone_1") as string)?.trim();
  if (!title || !milestoneTitle) return;

  const opportunity = await db.query.crm_opportunities.findFirst({
    where: and(eq(crm_opportunities.id, opportunityId), eq(crm_opportunities.user_id, userId)),
  });
  if (!opportunity) return;

  const groupId = (formData.get("group_id") as string) || (await getDefaultGroupId(userId));
  if (!groupId) return;

  const [goal] = await db
    .insert(goals)
    .values({
      user_id: userId,
      group_id: groupId,
      title,
      opportunity_id: opportunityId,
      customer_id: opportunity.customer_id,
      status: "active",
      goal_type: "concrete",
      importance: "normal",
    })
    .returning();

  if (!goal) return;

  await db.insert(milestones).values({
    goal_id: goal.id,
    title: milestoneTitle,
    position: 0,
    status: "in_progress",
  });

  await db.insert(activity_log).values({
    goal_id: goal.id,
    action: "goal_created",
    metadata: { title: goal.title, opportunity_id: opportunityId },
  });

  revalidatePath("/opportunities");
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function linkGoalToOpportunity(opportunityId: string, goalId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const opportunity = await db.query.crm_opportunities.findFirst({
    where: and(eq(crm_opportunities.id, opportunityId), eq(crm_opportunities.user_id, userId)),
  });
  if (!opportunity) return;

  await db
    .update(goals)
    .set({
      opportunity_id: opportunityId,
      customer_id: opportunity.customer_id,
    })
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath("/opportunities");
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}

export async function unlinkGoalFromOpportunity(goalId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  await db
    .update(goals)
    .set({ opportunity_id: null })
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath("/opportunities");
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
