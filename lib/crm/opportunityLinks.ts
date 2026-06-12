import { db } from "@/db";
import {
  crm_opportunity_customers,
  crm_opportunity_contacts,
  crm_customers,
  crm_contacts,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { CrmContact, CrmCustomer, CrmOpportunity } from "@/lib/types";
import { resolveOrCreateCustomerId } from "@/lib/crm/resolveCustomer";

export function parseIdList(formData: FormData, key: string): string[] {
  const values = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return [...new Set(values)];
}

export async function resolveOwnedCustomerIds(
  formData: FormData,
  userId: string,
): Promise<string[]> {
  const ids = new Set(parseIdList(formData, "customer_ids"));

  const legacyId = (formData.get("customer_id") as string) || null;
  if (legacyId) ids.add(legacyId);

  const newCustomerId = await resolveOrCreateCustomerId(formData, userId);
  if (newCustomerId) ids.add(newCustomerId);

  if (ids.size === 0) return [];

  const owned = await db
    .select({ id: crm_customers.id })
    .from(crm_customers)
    .where(and(eq(crm_customers.user_id, userId), inArray(crm_customers.id, [...ids])));

  return owned.map((row) => row.id);
}

export async function resolveOwnedContactIds(
  formData: FormData,
  userId: string,
  customerIds: string[],
): Promise<string[]> {
  const ids = new Set(parseIdList(formData, "contact_ids"));

  const legacyId = (formData.get("contact_id") as string) || null;
  if (legacyId) ids.add(legacyId);

  if (ids.size === 0) return [];

  const owned = await db
    .select({ id: crm_contacts.id, customer_id: crm_contacts.customer_id })
    .from(crm_contacts)
    .where(and(eq(crm_contacts.user_id, userId), inArray(crm_contacts.id, [...ids])));

  return owned
    .filter(
      (contact) =>
        !customerIds.length ||
        !contact.customer_id ||
        customerIds.includes(contact.customer_id),
    )
    .map((contact) => contact.id);
}

export async function syncOpportunityLinks(
  opportunityId: string,
  customerIds: string[],
  contactIds: string[],
) {
  await db
    .delete(crm_opportunity_customers)
    .where(eq(crm_opportunity_customers.opportunity_id, opportunityId));
  await db
    .delete(crm_opportunity_contacts)
    .where(eq(crm_opportunity_contacts.opportunity_id, opportunityId));

  if (customerIds.length > 0) {
    await db.insert(crm_opportunity_customers).values(
      customerIds.map((customerId) => ({
        opportunity_id: opportunityId,
        customer_id: customerId,
      })),
    );
  }

  if (contactIds.length > 0) {
    await db.insert(crm_opportunity_contacts).values(
      contactIds.map((contactId) => ({
        opportunity_id: opportunityId,
        contact_id: contactId,
      })),
    );
  }
}

type OpportunityLinkRow = {
  crm_opportunity_customers?: Array<{
    crm_customers: Pick<CrmCustomer, "id" | "name"> | null;
  }>;
  crm_opportunity_contacts?: Array<{
    crm_contacts: Pick<CrmContact, "id" | "first_name" | "last_name"> | null;
  }>;
};

export function getLinkedCustomers(
  opportunity: CrmOpportunity & OpportunityLinkRow,
): Pick<CrmCustomer, "id" | "name">[] {
  const fromLinks =
    opportunity.linked_customers ??
    opportunity.crm_opportunity_customers
      ?.map((row) => row.crm_customers)
      .filter((customer): customer is Pick<CrmCustomer, "id" | "name"> => !!customer) ??
    [];

  if (fromLinks.length > 0) return fromLinks;
  return opportunity.crm_customers ? [opportunity.crm_customers] : [];
}

export function getLinkedContacts(
  opportunity: CrmOpportunity & OpportunityLinkRow,
): Pick<CrmContact, "id" | "first_name" | "last_name">[] {
  const fromLinks =
    opportunity.linked_contacts ??
    opportunity.crm_opportunity_contacts
      ?.map((row) => row.crm_contacts)
      .filter((contact): contact is Pick<CrmContact, "id" | "first_name" | "last_name"> => !!contact) ??
    [];

  if (fromLinks.length > 0) return fromLinks;
  return opportunity.crm_contacts ? [opportunity.crm_contacts] : [];
}

export function formatEntitySummary(labels: string[], maxVisible = 2): string | null {
  if (labels.length === 0) return null;
  if (labels.length <= maxVisible) return labels.join(", ");
  const visible = labels.slice(0, maxVisible).join(", ");
  return `${visible} +${labels.length - maxVisible}`;
}
