"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OpportunityStatus } from "@/lib/types";

function stageToStatus(stage: string): OpportunityStatus {
  if (stage === "Won") return "won";
  if (stage === "Lost") return "lost";
  return "open";
}

export async function createOpportunity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const valueStr = formData.get("value") as string;
  const value = valueStr ? parseFloat(valueStr) : null;
  const stage = (formData.get("stage") as string) || "Lead";

  await supabase.from("crm_opportunities").insert({
    user_id: user.id,
    title,
    customer_id: (formData.get("customer_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    flow_id: (formData.get("flow_id") as string) || null,
    value: value && !isNaN(value) ? value : null,
    stage,
    status: stageToStatus(stage),
    close_date: (formData.get("close_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/opportunities");
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("crm_opportunities").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/opportunities");
}

export async function moveOpportunity(id: string, stage: string) {
  const trimmed = stage.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("crm_opportunities")
    .update({ stage: trimmed, status: stageToStatus(trimmed) })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/opportunities");
}
