import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
