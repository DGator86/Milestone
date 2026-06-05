"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin, countAdmins } from "@/lib/admin";

function back(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  redirect(`/team?${qs}`);
}

// Create a new account that can sign in to this deployment. Mirrors signup but
// is admin-driven, sets the chosen role, and does not start a session.
export async function inviteMember(formData: FormData): Promise<void> {
  await requireAdmin();

  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");
  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string" || !emailRaw.trim() || !passwordRaw) {
    back({ error: "Email and a temporary password are required" });
  }
  const email = (emailRaw as string).trim().toLowerCase();
  const password = passwordRaw as string;
  if (password.length < 6) {
    back({ error: "Temporary password must be at least 6 characters" });
  }
  const isAdmin = formData.get("is_admin") === "on";

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    back({ error: "An account with this email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ email, password_hash, is_admin: isAdmin });

  revalidatePath("/team");
  back({ ok: `Invited ${email}` });
}

// Promote or demote a member. Guards against demoting the last admin.
export async function setMemberRole(formData: FormData): Promise<void> {
  await requireAdmin();

  const userId = formData.get("user_id");
  const makeAdmin = formData.get("make_admin") === "true";
  if (typeof userId !== "string" || !userId) back({ error: "Missing member" });

  const target = await db.query.users.findFirst({
    columns: { id: true, email: true, is_admin: true },
    where: eq(users.id, userId as string),
  });
  if (!target) back({ error: "Member not found" });

  if (target!.is_admin === makeAdmin) {
    back({ ok: "No change" });
  }
  if (!makeAdmin && target!.is_admin && (await countAdmins()) <= 1) {
    back({ error: "Can't remove the last admin — promote someone else first" });
  }

  await db.update(users).set({ is_admin: makeAdmin }).where(eq(users.id, userId as string));
  revalidatePath("/team");
  back({ ok: makeAdmin ? `${target!.email} is now an admin` : `${target!.email} is now a member` });
}

// Permanently delete a member account. Guards against self-removal and the
// last admin. Cascades remove that member's own data (FKs are ON DELETE CASCADE).
export async function removeMember(formData: FormData): Promise<void> {
  const adminId = await requireAdmin();

  const userId = formData.get("user_id");
  if (typeof userId !== "string" || !userId) back({ error: "Missing member" });
  if (userId === adminId) back({ error: "You can't remove your own account here" });

  const target = await db.query.users.findFirst({
    columns: { id: true, email: true, is_admin: true },
    where: eq(users.id, userId as string),
  });
  if (!target) back({ error: "Member not found" });

  if (target!.is_admin && (await countAdmins()) <= 1) {
    back({ error: "Can't remove the last admin" });
  }

  await db.delete(users).where(eq(users.id, userId as string));
  revalidatePath("/team");
  back({ ok: `Removed ${target!.email}` });
}
