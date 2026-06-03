"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CreateGroupSchema } from "@/lib/schemas";

export async function createGroup(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    color: (formData.get("color") as string) || "#1769FF",
  };

  const parsed = CreateGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { name, color } = parsed.data;

  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", name)
    .maybeSingle();

  if (existing) return { error: "A group with that name already exists" };

  const { data: last } = await supabase
    .from("groups")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("groups").insert({
    user_id: user.id,
    name,
    color,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (insertError) return { error: "Failed to create group" };

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGroup(groupId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: goals } = await supabase
    .from("goals")
    .select("id")
    .eq("group_id", groupId)
    .eq("status", "active")
    .limit(1);

  if (goals && goals.length > 0) {
    return { error: "Cannot delete a group that has active goals" };
  }

  const { error: deleteError } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", user.id);

  if (deleteError) return { error: "Failed to delete group" };

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  return {};
}
