"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdateGoalSchema } from "@/lib/schemas";
import type { GoalStatus, MilestoneStatus } from "@/lib/types";

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
  goalId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (status === "completed") {
    await supabase
      .from("milestones")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", milestoneId);

    const { data: remaining } = await supabase
      .from("milestones")
      .select("id")
      .eq("goal_id", goalId)
      .neq("status", "completed")
      .order("position", { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from("milestones")
        .update({ status: "in_progress" })
        .eq("id", remaining[0].id);
    } else {
      await supabase.from("goals").update({ status: "completed" }).eq("id", goalId);
    }
  } else {
    await supabase
      .from("milestones")
      .update({ status, completed_at: null })
      .eq("id", milestoneId);
  }

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
}

export async function addMilestone(goalId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const { data: existing } = await supabase
    .from("milestones")
    .select("position")
    .eq("goal_id", goalId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  await supabase.from("milestones").insert({
    goal_id: goalId,
    title,
    position: nextPosition,
    status: "upcoming",
  });

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
}

export async function deleteMilestone(milestoneId: string, goalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("milestones").delete().eq("id", milestoneId);

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
}

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

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return { success: true };
}

export async function setGoalStatus(goalId: string, status: GoalStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("goals").update({ status }).eq("id", goalId);

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
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
  revalidatePath(`/goals/${goalId}`);
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
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
  return {};
}
