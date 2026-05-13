"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export async function updateGoal(goalId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  const importance = formData.get("importance") as string;
  const groupId = formData.get("group_id") as string;
  const dueDate = formData.get("due_date") as string;
  const goalType = formData.get("goal_type") as string;

  await supabase
    .from("goals")
    .update({
      ...(title && { title }),
      ...(importance && { importance }),
      ...(groupId && { group_id: groupId }),
      due_date: dueDate || null,
      ...(goalType && { goal_type: goalType }),
    })
    .eq("id", goalId);

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
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

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const { data: existing } = await supabase
    .from("groups")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  await supabase.from("groups").insert({
    user_id: user.id,
    name,
    sort_order: nextOrder,
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");
}
