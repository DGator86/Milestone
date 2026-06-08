import { db } from "@/db";
import { crm_customers, crm_contacts, crm_opportunities } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function resolveGoalCrmLinks(
  userId: string,
  formData: FormData
): Promise<{
  customer_id: string | null;
  crm_contact_id: string | null;
  opportunity_id: string | null;
}> {
  const submittedCustomerId = (formData.get("customer_id") as string) || null;
  const submittedContactId = (formData.get("crm_contact_id") as string) || null;
  const submittedOppId = (formData.get("opportunity_id") as string) || null;

  let customerId: string | null = null;
  if (submittedCustomerId) {
    const owned = await db.query.crm_customers.findFirst({
      columns: { id: true },
      where: and(eq(crm_customers.id, submittedCustomerId), eq(crm_customers.user_id, userId)),
    });
    customerId = owned ? submittedCustomerId : null;
  }

  let crmContactId: string | null = null;
  if (submittedContactId) {
    const owned = await db.query.crm_contacts.findFirst({
      columns: { id: true, customer_id: true },
      where: and(eq(crm_contacts.id, submittedContactId), eq(crm_contacts.user_id, userId)),
    });
    if (owned && (!customerId || owned.customer_id === customerId)) {
      crmContactId = submittedContactId;
      if (!customerId && owned.customer_id) customerId = owned.customer_id;
    }
  }

  let opportunityId: string | null = null;
  if (submittedOppId) {
    const owned = await db.query.crm_opportunities.findFirst({
      columns: { id: true, customer_id: true, contact_id: true },
      where: and(eq(crm_opportunities.id, submittedOppId), eq(crm_opportunities.user_id, userId)),
    });
    if (owned) {
      opportunityId = submittedOppId;
      if (!customerId && owned.customer_id) customerId = owned.customer_id;
      if (!crmContactId && owned.contact_id) crmContactId = owned.contact_id;
    }
  }

  return { customer_id: customerId, crm_contact_id: crmContactId, opportunity_id: opportunityId };
}

export async function getCrmLinkOptions(userId: string) {
  const [customers, contacts, opportunities] = await Promise.all([
    db.select({ id: crm_customers.id, name: crm_customers.name })
      .from(crm_customers)
      .where(eq(crm_customers.user_id, userId))
      .orderBy(asc(crm_customers.name)),
    db.select({
      id: crm_contacts.id,
      first_name: crm_contacts.first_name,
      last_name: crm_contacts.last_name,
      customer_id: crm_contacts.customer_id,
    })
      .from(crm_contacts)
      .where(eq(crm_contacts.user_id, userId))
      .orderBy(asc(crm_contacts.first_name)),
    db.select({
      id: crm_opportunities.id,
      title: crm_opportunities.title,
      customer_id: crm_opportunities.customer_id,
    })
      .from(crm_opportunities)
      .where(eq(crm_opportunities.user_id, userId))
      .orderBy(asc(crm_opportunities.title)),
  ]);
  return { customers, contacts, opportunities };
}
