import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_customers, goals } from "@/db/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import CustomersView from "@/components/crm/CustomersView";
import type { CrmCustomer, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const user: AppUser = { id: userId, email: session.user.email };

  const [data, goalCountRows] = await Promise.all([
    db.query.crm_customers.findMany({
      where: eq(crm_customers.user_id, userId),
      orderBy: [desc(crm_customers.created_at)],
    }),
    db
      .select({ customer_id: goals.customer_id, count: sql<number>`count(*)::int` })
      .from(goals)
      .where(and(eq(goals.user_id, userId), isNotNull(goals.customer_id)))
      .groupBy(goals.customer_id),
  ]);

  const customers: CrmCustomer[] = data as CrmCustomer[];
  const goalCounts: Record<string, number> = {};
  for (const row of goalCountRows) {
    if (row.customer_id) goalCounts[row.customer_id] = row.count;
  }

  return (
    <AppShell user={user}>
      <CustomersView customers={customers} goalCounts={goalCounts} />
    </AppShell>
  );
}
