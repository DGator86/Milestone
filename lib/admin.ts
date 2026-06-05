import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, count } from "drizzle-orm";

// Whether the given user may access admin/config surfaces (Settings, Flows).
// Falls back to `true` if the column isn't migrated yet, so the single-user
// experience is never accidentally locked out before `npm run db:push`.
export const getIsAdmin = cache(async (userId: string): Promise<boolean> => {
  try {
    const row = await db.query.users.findFirst({
      columns: { is_admin: true },
      where: eq(users.id, userId),
    });
    return row?.is_admin ?? true;
  } catch {
    return true;
  }
});

// Guard for admin-only server actions: resolves the current admin's id or
// redirects. Returns the session user id so callers can self-reference.
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!(await getIsAdmin(session.user.id))) redirect("/dashboard");
  return session.user.id;
}

export interface Member {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
}

// All accounts that can sign in to this deployment, oldest first.
export async function listMembers(): Promise<Member[]> {
  return db.query.users.findMany({
    columns: { id: true, email: true, name: true, is_admin: true, created_at: true },
    orderBy: (u, { asc }) => [asc(u.created_at)],
  });
}

// How many admins remain — used to prevent locking out the last admin.
export async function countAdmins(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.is_admin, true));
  return row?.n ?? 0;
}
