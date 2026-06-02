"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaskType, TaskPriority } from "@/lib/types";

const TASK_TYPES: TaskType[] = ["call", "email", "meeting", "task", "document"];
const TASK_PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const type = formData.get("type") as TaskType;
  const priority = formData.get("priority") as TaskPriority;

  await supabase.from("crm_tasks").insert({
    user_id: user.id,
    title,
    type: TASK_TYPES.includes(type) ? type : "task",
    priority: TASK_PRIORITIES.includes(priority) ? priority : "medium",
    due_date: (formData.get("due_date") as string) || null,
    customer_id: (formData.get("customer_id") as string) || null,
    contact_id: (formData.get("contact_id") as string) || null,
    opportunity_id: (formData.get("opportunity_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/dashboard");
}

export async function toggleTaskDone(id: string, done: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("crm_tasks")
    .update({ done, completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("crm_tasks").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
}

export async function toggleGoalPinned(id: string, pinned: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("goals")
    .update({ pinned })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
