"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function seedDemoData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Create two demo groups
  const { data: groups, error: gErr } = await supabase
    .from("groups")
    .insert([
      { user_id: user.id, name: "Work", color: "#1769FF", sort_order: 1 },
      { user_id: user.id, name: "Personal", color: "#36A852", sort_order: 2 },
    ])
    .select();

  if (gErr || !groups) return { error: gErr?.message ?? "Failed to create groups" };

  const workGroup = groups[0];
  const personalGroup = groups[1];

  // Create demo contacts
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const lastMonth = new Date(Date.now() - 32 * 86400000).toISOString();

  const { error: cErr } = await supabase.from("contacts").insert([
    {
      user_id: user.id,
      name: "Sarah Chen",
      email: "sarah@example.com",
      company: "Acme Corp",
      role: "VP of Engineering",
      touch_frequency_days: 14,
      last_touched_at: lastWeek,
      status: "active",
    },
    {
      user_id: user.id,
      name: "Mike Rodriguez",
      email: "mike@example.com",
      company: "Bright Systems",
      role: "Founder",
      touch_frequency_days: 7,
      last_touched_at: lastMonth,
      status: "active",
      notes: "Intro'd through LinkedIn. Interested in Q3 pilot.",
    },
    {
      user_id: user.id,
      name: "Jennifer Kim",
      email: "jen@example.com",
      company: "NovaTech",
      role: "Head of Sales",
      touch_frequency_days: 30,
      last_touched_at: null,
      status: "active",
    },
  ]);

  if (cErr) return { error: cErr.message };

  // Create demo goals
  const { data: goals, error: goalsErr } = await supabase
    .from("goals")
    .insert([
      {
        user_id: user.id,
        group_id: workGroup.id,
        title: "Launch Q3 product demo",
        goal_type: "deadline",
        importance: "critical",
        status: "active",
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      },
      {
        user_id: user.id,
        group_id: workGroup.id,
        title: "Close enterprise pilot with Acme",
        goal_type: "concrete",
        importance: "important",
        status: "active",
        due_date: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
      },
      {
        user_id: user.id,
        group_id: personalGroup.id,
        title: "Run a 5K",
        goal_type: "concrete",
        importance: "normal",
        status: "active",
        due_date: null,
      },
    ])
    .select();

  if (goalsErr || !goals) return { error: goalsErr?.message ?? "Failed to create goals" };

  const [demoGoal, pilotGoal, runGoal] = goals;

  // Create milestones for each goal
  const milestoneInserts = [
    // Demo goal (deadline — one stuck)
    { goal_id: demoGoal.id, title: "Draft demo script", position: 1, status: "completed" },
    { goal_id: demoGoal.id, title: "Build slide deck", position: 2, status: "completed" },
    { goal_id: demoGoal.id, title: "Record walkthrough video", position: 3, status: "stuck" },
    { goal_id: demoGoal.id, title: "Share with 3 customers", position: 4, status: "upcoming" },

    // Pilot goal (in progress)
    { goal_id: pilotGoal.id, title: "Initial discovery call", position: 1, status: "completed" },
    { goal_id: pilotGoal.id, title: "Send proposal", position: 2, status: "in_progress" },
    { goal_id: pilotGoal.id, title: "Negotiate terms", position: 3, status: "upcoming" },
    { goal_id: pilotGoal.id, title: "Sign contract", position: 4, status: "upcoming" },

    // Personal goal (all upcoming)
    { goal_id: runGoal.id, title: "Start Couch-to-5K plan", position: 1, status: "upcoming" },
    { goal_id: runGoal.id, title: "Run 2K without stopping", position: 2, status: "upcoming" },
    { goal_id: runGoal.id, title: "Complete week 6 workout", position: 3, status: "upcoming" },
    { goal_id: runGoal.id, title: "Race day", position: 4, status: "upcoming" },
  ];

  const { error: mErr } = await supabase.from("milestones").insert(milestoneInserts);
  if (mErr) return { error: mErr.message };

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  revalidatePath("/contacts");

  return { success: true };
}
