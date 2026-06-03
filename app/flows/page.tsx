import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_flows, crm_opportunities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import FlowsView from "@/components/crm/FlowsView";
import type { CrmFlow, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const user: AppUser = { id: userId, email: session.user.email };

  const [flowsRaw, oppCounts] = await Promise.all([
    db.query.crm_flows.findMany({
      where: eq(crm_flows.user_id, userId),
      orderBy: [desc(crm_flows.created_at)],
    }),
    db.select({ flow_id: crm_opportunities.flow_id })
      .from(crm_opportunities)
      .where(eq(crm_opportunities.user_id, userId)),
  ]);

  const flows: CrmFlow[] = flowsRaw as CrmFlow[];
  const countByFlow: Record<string, number> = {};
  for (const opp of oppCounts) {
    if (opp.flow_id) countByFlow[opp.flow_id] = (countByFlow[opp.flow_id] ?? 0) + 1;
  }

  return (
    <AppShell user={user}>
      <FlowsView flows={flows} oppCountByFlow={countByFlow} />
    </AppShell>
  );
}
