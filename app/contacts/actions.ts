"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createContact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();
  if (!firstName || !lastName) return;

  await db.insert(crm_contacts).values({
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    title: (formData.get("title") as string) || null,
    customer_id: (formData.get("customer_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
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

  await db.update(crm_contacts)
    .set({
      first_name: firstName,
      last_name: lastName,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      title: (formData.get("title") as string) || null,
      customer_id: (formData.get("customer_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
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
