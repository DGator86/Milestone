import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import CustomersView from "@/components/crm/CustomersView";
import type { CrmCustomer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("crm_customers")
    .select("*")
    .order("created_at", { ascending: false });

  const customers: CrmCustomer[] = data ?? [];

  return (
    <AppShell user={user}>
      <CustomersView customers={customers} />
    </AppShell>
  );
}
