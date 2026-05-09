"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdateGoalSchema } from "@/lib/schemas";

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

  const raw = {
    title: (formData.get("title") as string)?.trim() ?? "",
    group_id: (formData.get("group_id") as string) ?? "",
    goal_type: (formData.get("goal_type") as string) || "concrete",
    importance: (formData.get("importance") as string) || "normal",
    due_date: (formData.get("due_date") as string) || null,
  };

  const parsed = UpdateGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { title, group_id: groupId, goal_type: goalType, importance, due_date: dueDate } = parsed.data;

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
