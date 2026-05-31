import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import FlowsView from "@/components/crm/FlowsView";
import type { CrmFlow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: flowsRaw }, { data: oppCounts }] = await Promise.all([
    supabase.from("crm_flows").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_opportunities").select("flow_id"),
  ]);

  const flows: CrmFlow[] = flowsRaw ?? [];
  const countByFlow: Record<string, number> = {};
  for (const opp of oppCounts ?? []) {
    if (opp.flow_id) countByFlow[opp.flow_id] = (countByFlow[opp.flow_id] ?? 0) + 1;
  }

  return (
    <AppShell user={user}>
      <FlowsView flows={flows} oppCountByFlow={countByFlow} />
    </AppShell>
  );
}
