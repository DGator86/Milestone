"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_flows } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createFlow(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const stagesRaw = (formData.get("stages") as string) ?? "";
  const stages = stagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await db.insert(crm_flows).values({
    user_id: userId,
    name,
    description: (formData.get("description") as string) || null,
    color: (formData.get("color") as string) || "#1769FF",
    stages: stages.length > 0 ? stages : ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
  });

  revalidatePath("/flows");
}

export async function updateFlow(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const stagesRaw = (formData.get("stages") as string) ?? "";
  const stages = stagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await db.update(crm_flows)
    .set({
      name,
      description: (formData.get("description") as string) || null,
      color: (formData.get("color") as string) || "#1769FF",
      stages: stages.length > 0 ? stages : ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
    })
    .where(and(eq(crm_flows.id, id), eq(crm_flows.user_id, userId)));

  revalidatePath("/flows");
}

export async function deleteFlow(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.delete(crm_flows)
    .where(and(eq(crm_flows.id, id), eq(crm_flows.user_id, userId)));

  revalidatePath("/flows");
}
