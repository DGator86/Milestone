import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import ContactsView from "@/components/crm/ContactsView";
import type { CrmContact, CrmCustomer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contactsRaw }, { data: customersRaw }] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("*, crm_customers(id, name)")
      .order("created_at", { ascending: false }),
    supabase.from("crm_customers").select("id, name").order("name"),
  ]);

  const contacts: CrmContact[] = contactsRaw ?? [];
  const customers: Pick<CrmCustomer, "id" | "name">[] = customersRaw ?? [];

  return (
    <AppShell user={user}>
      <ContactsView contacts={contacts} customers={customers} />
    </AppShell>
  );
}
