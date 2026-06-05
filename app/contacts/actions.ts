"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_contacts, crm_customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/settings";
import { collectCustomValues } from "@/lib/customFields";

// Returns the submitted customer_id only if it belongs to the current user,
// otherwise null. Prevents linking a contact to another tenant's company.
async function resolveOwnedCustomerId(
  formData: FormData,
  userId: string,
): Promise<string | null> {
  const customerId = (formData.get("customer_id") as string) || null;
  if (!customerId) return null;
  const owned = await db.query.crm_customers.findFirst({
    columns: { id: true },
    where: and(eq(crm_customers.id, customerId), eq(crm_customers.user_id, userId)),
  });
  return owned ? customerId : null;
}

export async function createContact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) return;

  const customerId = await resolveOwnedCustomerId(formData, userId);
  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.contact);

  await db.insert(crm_contacts).values({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    title: (formData.get("title") as string) || null,
    customer_id: customerId,
    notes: (formData.get("notes") as string) || null,
    custom,
  });

  revalidatePath("/contacts");
}

export async function updateContact(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) return;

  const customerId = await resolveOwnedCustomerId(formData, userId);
  const { customFields } = await getSettings(userId);
  const custom = collectCustomValues(formData, customFields.contact);

  await db.update(crm_contacts)
    .set({
      first_name: firstName,
      last_name: lastName,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      title: (formData.get("title") as string) || null,
      customer_id: customerId,
      notes: (formData.get("notes") as string) || null,
      custom,
    })
    .where(and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)));

  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.delete(crm_contacts)
    .where(and(eq(crm_contacts.id, id), eq(crm_contacts.user_id, userId)));

  revalidatePath("/contacts");
}
