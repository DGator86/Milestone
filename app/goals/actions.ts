"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateGoal(
  goalId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  const groupId = formData.get("group_id") as string;
  const goalType = formData.get("goal_type") as string;
  const importance = formData.get("importance") as string;
  const dueDate = (formData.get("due_date") as string) || null;

  if (!title || !groupId) return { error: "Title and group are required" };

  const { error } = await supabase
    .from("goals")
    .update({ title, group_id: groupId, goal_type: goalType, importance, due_date: dueDate })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to update goal" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return { success: true };
}

export async function archiveGoal(goalId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("goals")
    .update({ status: "archived" })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to archive goal" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return {};
}

export async function deleteGoal(goalId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete goal" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return {};
}

export async function reactivateGoal(goalId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("goals")
    .update({ status: "active" })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to reactivate goal" };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return {};
}
