import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_opportunities, crm_customers, crm_contacts, crm_flows, goals, groups } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import OpportunitiesView from "@/components/crm/OpportunitiesView";
import { getSettings } from "@/lib/settings";
import { getGoalsByOpportunityIds } from "@/lib/crm/related";
import type { CrmOpportunity, CrmCustomer, CrmContact, CrmFlow, AppUser, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const { highlight } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = await getDataOwnerId();
  const user: AppUser = { id: session.user.id, email: session.user.email };

  const [oppsRaw, customersRaw, contactsRaw, flowsRaw, groupsRaw, goalsRaw] = await Promise.all([
    db.query.crm_opportunities.findMany({
      where: eq(crm_opportunities.user_id, userId),
      with: {
        crm_customers: true,
        crm_contacts: true,
        crm_flows: true,
        crm_opportunity_customers: {
          with: { crm_customers: { columns: { id: true, name: true } } },
        },
        crm_opportunity_contacts: {
          with: { crm_contacts: { columns: { id: true, first_name: true, last_name: true } } },
        },
      },
      orderBy: [desc(crm_opportunities.created_at)],
    }),
    db
      .select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
    db
      .select({
        id: crm_contacts.id,
        first_name: crm_contacts.first_name,
        last_name: crm_contacts.last_name,
        customer_id: crm_contacts.customer_id,
      })
      .from(crm_contacts)
      .where(eq(crm_contacts.user_id, userId))
      .orderBy(asc(crm_contacts.first_name)),
    db
      .select({ id: crm_flows.id, name: crm_flows.name, stages: crm_flows.stages })
      .from(crm_flows)
      .where(eq(crm_flows.user_id, userId))
      .orderBy(asc(crm_flows.name)),
    db.query.groups.findMany({
      where: eq(groups.user_id, userId),
      orderBy: [asc(groups.sort_order)],
    }),
    db
      .select({ id: goals.id, title: goals.title, opportunity_id: goals.opportunity_id })
      .from(goals)
      .where(and(eq(goals.user_id, userId), eq(goals.status, "active")))
      .orderBy(desc(goals.updated_at)),
  ]);

  const opportunities: CrmOpportunity[] = oppsRaw.map((opp) => ({
    ...opp,
    value: opp.value != null ? parseFloat(opp.value) : null,
    linked_customers: opp.crm_opportunity_customers
      .map((row) => row.crm_customers)
      .filter((customer): customer is Pick<CrmCustomer, "id" | "name"> => !!customer),
    linked_contacts: opp.crm_opportunity_contacts
      .map((row) => row.crm_contacts)
      .filter((contact): contact is Pick<CrmContact, "id" | "first_name" | "last_name"> => !!contact),
  })) as unknown as CrmOpportunity[];

  const goalsByOpportunity = await getGoalsByOpportunityIds(
    userId,
    opportunities.map((opp) => opp.id),
  );

  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw;
  const contacts: Pick<CrmContact, "id" | "first_name" | "last_name" | "customer_id">[] = contactsRaw;
  const flows: Pick<CrmFlow, "id" | "name" | "stages">[] = flowsRaw as unknown as Pick<
    CrmFlow,
    "id" | "name" | "stages"
  >[];
  const { terms, customFields } = await getSettings(userId);

  return (
    <AppShell user={user}>
      <OpportunitiesView
        opportunities={opportunities}
        customers={customers}
        contacts={contacts}
        flows={flows}
        groups={groupsRaw as Group[]}
        linkableGoals={goalsRaw}
        customFields={customFields.opportunity}
        labelPlural={terms.opportunities}
        labelSingular={terms.opportunity}
        customerLabel={terms.customer}
        contactLabel={terms.contact}
        highlightId={highlight}
        goalsByOpportunity={goalsByOpportunity}
      />
    </AppShell>
  );
}
