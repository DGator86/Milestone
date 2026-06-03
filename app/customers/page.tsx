import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { crm_customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import CustomersView from "@/components/crm/CustomersView";
import type { CrmCustomer, AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const user: AppUser = { id: userId, email: session.user.email };

  const data = await db.query.crm_customers.findMany({
    where: eq(crm_customers.user_id, userId),
    orderBy: [desc(crm_customers.created_at)],
  });

  const customers: CrmCustomer[] = data as CrmCustomer[];

  return (
    <AppShell user={user}>
      <CustomersView customers={customers} />
    </AppShell>
  );
}
