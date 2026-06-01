"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createFlow(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const stagesRaw = (formData.get("stages") as string) ?? "";
  const stages = stagesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  await supabase.from("crm_flows").insert({
    user_id: user.id,
    name,
    description: (formData.get("description") as string) || null,
    color: (formData.get("color") as string) || "#1769FF",
    stages: stages.length > 0 ? stages : ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
  });

  revalidatePath("/flows");
}

export async function deleteFlow(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("crm_flows").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/flows");
}
