"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals, milestones, activity_log, groups } from "@/db/schema";
import { eq, and, ne, asc, max } from "drizzle-orm";
import { CreateGoalSchema } from "@/lib/schemas";

export async function createGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

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

  const [goal] = await db.insert(goals).values({
    user_id: userId,
    group_id: groupId,
    title,
    goal_type: goalType,
    importance,
    status: "active",
    due_date: dueDate || null,
  }).returning();

  if (!goal) redirect("/dashboard?error=Failed+to+create+goal");

  const milestoneRows = milestoneTitles.map((t, i) => ({
    goal_id: goal.id,
    title: t,
    position: i,
    status: i === 0 ? "in_progress" : "upcoming",
  }));

  await db.insert(milestones).values(milestoneRows);

  await db.insert(activity_log).values({
    goal_id: goal.id,
    action: "goal_created",
    metadata: { title: goal.title },
  });

  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
  redirect("/dashboard?created=1");
}

export async function completeMilestone(milestoneId: string, goalId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await db.update(milestones)
    .set({ status: "completed", completed_at: new Date().toISOString() })
    .where(eq(milestones.id, milestoneId));

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

  await db.insert(activity_log).values({
    goal_id: goalId,
    milestone_id: milestoneId,
    action: "milestone_completed",
    metadata: {},
  });

  revalidatePath("/dashboard");
  revalidatePath("/kill-list");
}

export async function ensureDefaults() {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const existing = await db.query.groups.findFirst({
    where: eq(groups.user_id, userId),
  });
  if (existing) return;

  await db.insert(groups).values([
    { user_id: userId, name: "Work", color: "#1769FF", sort_order: 0 },
    { user_id: userId, name: "Home", color: "#36A852", sort_order: 1 },
    { user_id: userId, name: "Health", color: "#F8B400", sort_order: 2 },
  ]);
}
