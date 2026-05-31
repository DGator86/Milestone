import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import OpportunitiesView from "@/components/crm/OpportunitiesView";
import type { CrmOpportunity, CrmCustomer, CrmContact, CrmFlow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: oppsRaw },
    { data: customersRaw },
    { data: contactsRaw },
    { data: flowsRaw },
  ] = await Promise.all([
    supabase
      .from("crm_opportunities")
      .select("*, crm_customers(id, name), crm_contacts(id, first_name, last_name), crm_flows(id, name, stages)")
      .order("created_at", { ascending: false }),
    supabase.from("crm_customers").select("id, name").order("name"),
    supabase.from("crm_contacts").select("id, first_name, last_name").order("first_name"),
    supabase.from("crm_flows").select("id, name, stages").order("name"),
  ]);

  const opportunities: CrmOpportunity[] = oppsRaw ?? [];
  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw ?? [];
  const contacts: Pick<CrmContact, "id" | "first_name" | "last_name">[] = contactsRaw ?? [];
  const flows: Pick<CrmFlow, "id" | "name" | "stages">[] = flowsRaw ?? [];

  return (
    <AppShell user={user}>
      <OpportunitiesView
        opportunities={opportunities}
        customers={customers}
        contacts={contacts}
        flows={flows}
      />
    </AppShell>
  );
}
