"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_flows, crm_flow_instances } from "@/db/schema";
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

export async function deleteFlow(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.delete(crm_flows)
    .where(and(eq(crm_flows.id, id), eq(crm_flows.user_id, userId)));

  revalidatePath("/flows");
}

export async function createFlowInstance(flowId: string, customerId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;
  await db.insert(crm_flow_instances).values({
    user_id: userId,
    flow_id: flowId,
    customer_id: customerId ?? null,
    current_stage_idx: 0,
    run_count: 1,
    status: "active",
  });
  revalidatePath("/flows");
}

export async function advanceFlowInstance(instanceId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const instance = await db.query.crm_flow_instances.findFirst({
    where: and(eq(crm_flow_instances.id, instanceId), eq(crm_flow_instances.user_id, userId)),
    with: { crm_flows: true },
  });
  if (!instance || !instance.crm_flows) return;

  const stageCount = instance.crm_flows.stages.length;
  const next = instance.current_stage_idx + 1;
  const wraps = next >= stageCount;

  await db
    .update(crm_flow_instances)
    .set({
      current_stage_idx: wraps ? 0 : next,
      run_count: wraps ? instance.run_count + 1 : instance.run_count,
      updated_at: new Date().toISOString(),
    })
    .where(and(eq(crm_flow_instances.id, instanceId), eq(crm_flow_instances.user_id, userId)));

  revalidatePath("/flows");
}

export async function deleteFlowInstance(instanceId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;
  await db
    .delete(crm_flow_instances)
    .where(and(eq(crm_flow_instances.id, instanceId), eq(crm_flow_instances.user_id, userId)));
  revalidatePath("/flows");
}
