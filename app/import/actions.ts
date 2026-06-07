"use server";

import { auth } from "@/auth";
import { getDataOwnerId } from "@/lib/workspace";
import { db } from "@/db";
import { crm_customers, crm_contacts, crm_opportunities } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";

type Row = Record<string, string>;

async function resolveCompany(userId: string, name: string | undefined) {
  if (!name?.trim()) return null;
  const match = await db.query.crm_customers.findFirst({
    where: and(eq(crm_customers.user_id, userId), ilike(crm_customers.name, name.trim())),
  });
  return match?.id ?? null;
}

export async function importCompanies(rows: Row[]): Promise<{ created: number; errors: string[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = await getDataOwnerId();

  let created = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) { errors.push("Row skipped: missing company name"); continue; }
    try {
      await db.insert(crm_customers).values({
        user_id: userId,
        name,
        industry: row.industry?.trim() || null,
        website: row.website?.trim() || null,
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        status: (["prospect", "active", "inactive"].includes(row.status?.trim()) ? row.status.trim() : "prospect"),
        notes: row.notes?.trim() || null,
      });
      created++;
    } catch {
      errors.push(`Failed to import "${name}"`);
    }
  }

  return { created, errors };
}

export async function importContacts(rows: Row[]): Promise<{ created: number; errors: string[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = await getDataOwnerId();

  let created = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const firstName = row.first_name?.trim();
    const lastName = row.last_name?.trim();
    if (!firstName || !lastName) { errors.push("Row skipped: missing first or last name"); continue; }
    try {
      const customerId = await resolveCompany(userId, row.company_name);
      await db.insert(crm_contacts).values({
        user_id: userId,
        customer_id: customerId,
        first_name: firstName,
        last_name: lastName,
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        title: row.title?.trim() || null,
        notes: row.notes?.trim() || null,
      });
      created++;
    } catch {
      errors.push(`Failed to import "${firstName} ${lastName}"`);
    }
  }

  return { created, errors };
}

export async function importOpportunities(rows: Row[]): Promise<{ created: number; errors: string[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = await getDataOwnerId();

  let created = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const title = row.title?.trim();
    if (!title) { errors.push("Row skipped: missing deal title"); continue; }
    try {
      const customerId = await resolveCompany(userId, row.company_name);
      const rawValue = row.value?.replace(/[$,\s]/g, "").trim();
      const value = rawValue && !isNaN(Number(rawValue)) ? rawValue : null;
      await db.insert(crm_opportunities).values({
        user_id: userId,
        customer_id: customerId,
        title,
        value,
        stage: row.stage?.trim() || "Lead",
        status: (["open", "won", "lost"].includes(row.status?.trim()) ? row.status.trim() : "open"),
        close_date: row.close_date?.trim() || null,
        notes: row.notes?.trim() || null,
      });
      created++;
    } catch {
      errors.push(`Failed to import "${title}"`);
    }
  }

  return { created, errors };
}
