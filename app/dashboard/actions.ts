"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateGoalSchema } from "@/lib/schemas";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const milestoneTitles: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const t = formData.get(`milestone_${i}`) as string;
    if (t?.trim()) milestoneTitles.push(t.trim());
  }

  const raw = {
    title: (formData.get("title") as string)?.trim() ?? "",
    group_id: (formData.get("group_id") as string) ?? "",
    goal_type: (formData.get("goal_type") as string) || "concrete",
    importance: (formData.get("importance") as string) || "normal",
    due_date: (formData.get("due_date") as string) || null,
  };

  const parsed = CreateGoalSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Validation error";
    redirect(`/dashboard?error=${encodeURIComponent(msg)}`);
  }

  if (milestoneTitles.length === 0) {
    redirect("/dashboard?error=At+least+one+milestone+is+required");
  }

  const { title, group_id: groupId, goal_type: goalType, importance, due_date: dueDate } = parsed.data;

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      group_id: groupId,
      title,
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
  redirect("/dashboard?created=1");
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
