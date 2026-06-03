"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_opportunities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { OpportunityStatus } from "@/lib/types";

function stageToStatus(stage: string): OpportunityStatus {
  if (stage === "Won") return "won";
  if (stage === "Lost") return "lost";
  return "open";
}

export async function createOpportunity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const valueStr = formData.get("value") as string;
  const value = valueStr ? parseFloat(valueStr) : null;
  const stage = (formData.get("stage") as string) || "Lead";

  await db.insert(crm_opportunities).values({
    user_id: userId,
    title,
    customer_id: (formData.get("customer_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    flow_id: (formData.get("flow_id") as string) || null,
    value: value !== null && !isNaN(value) ? String(value) : null,
    stage,
    status: stageToStatus(stage),
    close_date: (formData.get("close_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/opportunities");
}

export async function deleteOpportunity(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.delete(crm_opportunities)
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
}

export async function moveOpportunity(id: string, stage: string) {
  const trimmed = stage.trim();
  if (!trimmed) return;

  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.update(crm_opportunities)
    .set({ stage: trimmed, status: stageToStatus(trimmed) })
    .where(and(eq(crm_opportunities.id, id), eq(crm_opportunities.user_id, userId)));

  revalidatePath("/opportunities");
}
