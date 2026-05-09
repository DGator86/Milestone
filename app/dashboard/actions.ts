"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const groupId = formData.get("group_id") as string;
  const goalType = (formData.get("goal_type") as string) || "concrete";
  const importance = (formData.get("importance") as string) || "normal";
  const dueDate = (formData.get("due_date") as string) || null;

  const milestoneTitles: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const t = formData.get(`milestone_${i}`) as string;
    if (t?.trim()) milestoneTitles.push(t.trim());
  }

  if (!title?.trim() || !groupId || milestoneTitles.length === 0) {
    redirect("/dashboard?error=Missing+required+fields");
  }

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      group_id: groupId,
      title: title.trim(),
      goal_type: goalType,
      importance,
      status: "active",
      due_date: dueDate || null,
    })
    .select()
    .single();

  if (goalError || !goal) redirect("/dashboard?error=Failed+to+create+goal");

  const milestoneRows = milestoneTitles.map((t, i) => ({
    goal_id: goal.id,
    title: t,
    position: i,
    status: i === 0 ? "in_progress" : "upcoming",
  }));

  await supabase.from("milestones").insert(milestoneRows);

  await supabase.from("activity_log").insert({
    goal_id: goal.id,
    action: "goal_created",
    metadata: { title: goal.title },
  });

  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  redirect("/dashboard");
}

export async function completeMilestone(milestoneId: string, goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("milestones")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", milestoneId);

  const { data: remaining } = await supabase
    .from("milestones")
    .select("id, position")
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
    await supabase
      .from("goals")
      .update({ status: "completed" })
      .eq("id", goalId);
  }

  await supabase.from("activity_log").insert({
    goal_id: goalId,
    milestone_id: milestoneId,
    action: "milestone_completed",
    metadata: {},
  });

  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
}

export async function ensureDefaults() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ensure_default_groups");
  if (error) {
    console.error("ensure_default_groups failed:", error.message);
  }
}
