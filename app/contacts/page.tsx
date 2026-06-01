import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import ContactList from "@/components/contacts/ContactList";
import AddContactForm from "@/components/contacts/AddContactForm";
import { Users } from "lucide-react";
import type { Contact, Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contactsRaw }, { data: listsRaw }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, groups(*)")
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase
      .from("groups")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const contacts: Contact[] = contactsRaw ?? [];
  const lists: Group[] = listsRaw ?? [];

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Users size={20} className="text-milestone-blue" />
              Contacts
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {contacts.length} active contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <ContactList contacts={contacts} />

        <div className="mt-4">
          <AddContactForm lists={lists} />
        </div>
      </div>
    </AppShell>
  );
}
