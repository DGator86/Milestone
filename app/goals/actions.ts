"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals, milestones, activity_log } from "@/db/schema";
import { eq, and, ne, asc, desc } from "drizzle-orm";
import { UpdateGoalSchema } from "@/lib/schemas";
import type { GoalStatus, MilestoneStatus } from "@/lib/types";

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus,
  goalId: string
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  if (status === "completed") {
    await db.update(milestones)
      .set({ status: "completed", completed_at: new Date().toISOString() })
      .where(eq(milestones.id, milestoneId));

    await db.insert(activity_log).values({
      goal_id: goalId,
      milestone_id: milestoneId,
      action: "milestone_completed",
      metadata: {},
    });

    const remaining = await db.query.milestones.findMany({
      where: and(eq(milestones.goal_id, goalId), ne(milestones.status, "completed")),
      orderBy: [asc(milestones.position)],
    });

    if (remaining.length > 0) {
      await db.update(milestones)
        .set({ status: "in_progress" })
        .where(eq(milestones.id, remaining[0].id));
    } else {
      await db.update(goals)
        .set({ status: "completed" })
        .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));
    }
  } else {
    await db.update(milestones)
      .set({ status, completed_at: null })
      .where(eq(milestones.id, milestoneId));

    const parentGoal = await db.query.goals.findFirst({
      where: and(eq(goals.id, goalId), eq(goals.user_id, userId)),
    });

    if (parentGoal?.status === "completed") {
      await db.update(goals)
        .set({ status: "active" })
        .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));
    }

    await db.insert(activity_log).values({
      goal_id: goalId,
      milestone_id: milestoneId,
      action: "milestone_status_changed",
      metadata: { status },
    });
  }

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
}

export async function addMilestone(goalId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const existing = await db.query.milestones.findMany({
    where: eq(milestones.goal_id, goalId),
    orderBy: [desc(milestones.position)],
  });

  const nextPosition = (existing[0]?.position ?? -1) + 1;

  await db.insert(milestones).values({
    goal_id: goalId,
    title,
    position: nextPosition,
    status: "upcoming",
  });

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
}

export async function deleteMilestone(milestoneId: string, goalId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await db.delete(milestones).where(eq(milestones.id, milestoneId));

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
}

export async function updateGoal(
  goalId: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

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

  await db.update(goals)
    .set({ title, group_id: groupId, goal_type: goalType, importance, due_date: dueDate })
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return { success: true };
}

export async function setGoalStatus(goalId: string, status: GoalStatus) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await db.update(goals)
    .set({ status })
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
}

export async function archiveGoal(goalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  await db.update(goals)
    .set({ status: "archived" })
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return {};
}

export async function deleteGoal(goalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  await db.delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  return {};
}

export async function reactivateGoal(goalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const userId = session.user.id;

  await db.update(goals)
    .set({ status: "active" })
    .where(and(eq(goals.id, goalId), eq(goals.user_id, userId)));

  revalidatePath("/goals");
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/dashboard");
  return {};
}
