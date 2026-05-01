import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Users } from "lucide-react";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

  const safeGroups: Group[] = groups ?? [];

  return (
    <AppShell user={user}>
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Users size={22} className="text-milestone-blue" />
          Groups
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-milestone-line divide-y divide-milestone-line">
          {safeGroups.map((group) => (
            <div key={group.id} className="flex items-center gap-4 px-6 py-4">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: group.color ?? "#DFE6EF" }}
              />
              <span className="font-medium text-gray-900">{group.name}</span>
            </div>
          ))}
          {safeGroups.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">No groups yet.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
