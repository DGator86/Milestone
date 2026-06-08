import { db } from "@/db";
import { crm_notes, activity_log, goals } from "@/db/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";

export interface TimelineEntry {
  id: string;
  kind: "note" | "activity";
  label: string;
  detail?: string;
  created_at: string;
  href?: string;
}

export async function getTimelineForContact(
  userId: string,
  contactId: string,
  customerId: string | null,
  goalIds: string[]
): Promise<TimelineEntry[]> {
  const noteParts = [eq(crm_notes.contact_id, contactId)];
  if (customerId) noteParts.push(eq(crm_notes.customer_id, customerId));

  const notes = await db.query.crm_notes.findMany({
    where: and(
      eq(crm_notes.user_id, userId),
      noteParts.length === 1 ? noteParts[0] : or(...noteParts)
    ),
    orderBy: [desc(crm_notes.created_at)],
    limit: 30,
  });

  const entries: TimelineEntry[] = notes.map((n) => ({
    id: `note-${n.id}`,
    kind: "note",
    label: "Note added",
    detail: n.body,
    created_at: n.created_at,
  }));

  if (goalIds.length) {
    const logs = await db.query.activity_log.findMany({
      where: inArray(activity_log.goal_id, goalIds),
      orderBy: [desc(activity_log.created_at)],
      limit: 30,
      with: { goal: { columns: { id: true, title: true } } },
    });

    for (const log of logs) {
      entries.push({
        id: `act-${log.id}`,
        kind: "activity",
        label: formatActivity(log.action, log.metadata as Record<string, unknown>),
        detail: log.goal?.title,
        created_at: log.created_at,
        href: log.goal_id ? `/goals/${log.goal_id}` : undefined,
      });
    }
  }

  return entries.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 25);
}

export async function getTimelineForCustomer(
  userId: string,
  customerId: string,
  goalIds: string[]
): Promise<TimelineEntry[]> {
  const notes = await db.query.crm_notes.findMany({
    where: and(eq(crm_notes.user_id, userId), eq(crm_notes.customer_id, customerId)),
    orderBy: [desc(crm_notes.created_at)],
    limit: 30,
  });

  const entries: TimelineEntry[] = notes.map((n) => ({
    id: `note-${n.id}`,
    kind: "note",
    label: "Note added",
    detail: n.body,
    created_at: n.created_at,
  }));

  if (goalIds.length) {
    const logs = await db.query.activity_log.findMany({
      where: inArray(activity_log.goal_id, goalIds),
      orderBy: [desc(activity_log.created_at)],
      limit: 30,
      with: { goal: { columns: { id: true, title: true } } },
    });

    for (const log of logs) {
      entries.push({
        id: `act-${log.id}`,
        kind: "activity",
        label: formatActivity(log.action, log.metadata as Record<string, unknown>),
        detail: log.goal?.title,
        created_at: log.created_at,
        href: `/goals/${log.goal_id}`,
      });
    }
  }

  return entries.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 25);
}

export async function getTimelineForOpportunity(
  userId: string,
  opportunityId: string,
  goalIds: string[]
): Promise<TimelineEntry[]> {
  const notes = await db.query.crm_notes.findMany({
    where: and(eq(crm_notes.user_id, userId), eq(crm_notes.opportunity_id, opportunityId)),
    orderBy: [desc(crm_notes.created_at)],
    limit: 30,
  });

  const entries: TimelineEntry[] = notes.map((n) => ({
    id: `note-${n.id}`,
    kind: "note",
    label: "Note added",
    detail: n.body,
    created_at: n.created_at,
  }));

  if (goalIds.length) {
    const linkedGoals = await db.query.goals.findMany({
      where: and(eq(goals.user_id, userId), inArray(goals.id, goalIds)),
      columns: { id: true, title: true, created_at: true },
    });
    for (const g of linkedGoals) {
      entries.push({
        id: `goal-${g.id}`,
        kind: "activity",
        label: "Goal linked",
        detail: g.title,
        created_at: g.created_at,
        href: `/goals/${g.id}`,
      });
    }
  }

  return entries.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 25);
}

function formatActivity(action: string, metadata: Record<string, unknown>): string {
  switch (action) {
    case "goal_created":
      return "Goal created";
    case "milestone_completed":
      return "Milestone completed";
    case "milestone_status_changed":
      return `Milestone → ${metadata.status ?? "updated"}`;
    default:
      return action.replace(/_/g, " ");
  }
}
