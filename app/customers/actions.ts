"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const VALID_CUSTOMER_STATUSES = ["prospect", "active", "inactive"] as const;

export async function createCustomer(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const rawStatus = (formData.get("status") as string) || "prospect";
  const status = (VALID_CUSTOMER_STATUSES as readonly string[]).includes(rawStatus)
    ? rawStatus
    : "prospect";

  await db.insert(crm_customers).values({
    user_id: userId,
    name,
    industry: (formData.get("industry") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    website: (formData.get("website") as string) || null,
    status,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/customers");
}

export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.delete(crm_customers)
    .where(and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)));

  revalidatePath("/customers");
}

export async function updateCustomerStatus(id: string, status: string) {
  if (!(VALID_CUSTOMER_STATUSES as readonly string[]).includes(status)) return;

  const session = await auth();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  await db.update(crm_customers)
    .set({ status })
    .where(and(eq(crm_customers.id, id), eq(crm_customers.user_id, userId)));

  revalidatePath("/customers");
}
