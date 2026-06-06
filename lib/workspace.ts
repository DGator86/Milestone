import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface WorkspaceContext {
  id: string;
  name: string;
  ownerId: string;
}

// Resolve (and lazily bootstrap) the current session user's workspace.
//
// Each account starts in its own workspace, owned by itself — so a user's
// existing data (all keyed by their own id) stays visible. Admins add teammates
// to their workspace via the Team page (see app/team/actions.ts), and those
// members then resolve to the same owner id and share the data.
export const getWorkspace = cache(async (): Promise<WorkspaceContext> => {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Not authenticated");

  // Already mapped to a workspace?
  const me = await db.query.users.findFirst({
    columns: { id: true, workspace_id: true },
    where: eq(users.id, uid),
  });
  if (me?.workspace_id) {
    const ws = await db.query.workspaces.findFirst({ where: eq(workspaces.id, me.workspace_id) });
    if (ws) return { id: ws.id, name: ws.name, ownerId: ws.owner_id };
  }

  // Bootstrap: create a workspace owned by this user and map them to it.
  const [created] = await db.insert(workspaces).values({ owner_id: uid }).returning();
  await db.update(users).set({ workspace_id: created.id }).where(eq(users.id, uid));
  return { id: created.id, name: created.name, ownerId: created.owner_id };
});

// The user id under which all of the current workspace's shared data is stored
// and queried. Swapped in wherever data was previously scoped to the session
// user, so every existing query becomes workspace-scoped.
export const getDataOwnerId = cache(async (): Promise<string> => {
  return (await getWorkspace()).ownerId;
});
