"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  await supabase.from("crm_opportunities").insert({
    user_id: user.id,
    title,
    customer_id: (formData.get("customer_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    flow_id: (formData.get("flow_id") as string) || null,
    value: value && !isNaN(value) ? value : null,
    stage: (formData.get("stage") as string) || "Lead",
    status: "open",
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("crm_opportunities")
    .update({ stage })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/opportunities");
}

export async function setOpportunityStatus(id: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("crm_opportunities")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/opportunities");
}
