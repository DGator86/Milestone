"use server";

import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_notes } from "@/db/schema";
import { revalidatePath } from "next/cache";

function revalidateEntityPaths(fields: {
  contact_id?: string | null;
  customer_id?: string | null;
  goal_id?: string | null;
  opportunity_id?: string | null;
}) {
  if (fields.contact_id) revalidatePath(`/contacts/${fields.contact_id}`);
  if (fields.customer_id) revalidatePath(`/customers/${fields.customer_id}`);
  if (fields.goal_id) revalidatePath(`/goals/${fields.goal_id}`);
  if (fields.opportunity_id) revalidatePath(`/opportunities/${fields.opportunity_id}`);
}

export async function addCrmNote(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = await getDataOwnerId();

  const body = (formData.get("body") as string)?.trim();
  if (!body) return;

  const contactId = (formData.get("contact_id") as string) || null;
  const customerId = (formData.get("customer_id") as string) || null;
  const goalId = (formData.get("goal_id") as string) || null;
  const opportunityId = (formData.get("opportunity_id") as string) || null;

  if (!contactId && !customerId && !goalId && !opportunityId) return;

  await db.insert(crm_notes).values({
    user_id: userId,
    body,
    contact_id: contactId,
    customer_id: customerId,
    goal_id: goalId,
    opportunity_id: opportunityId,
  });

  revalidateEntityPaths({ contact_id: contactId, customer_id: customerId, goal_id: goalId, opportunity_id: opportunityId });
}
