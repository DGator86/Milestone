import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Users } from "lucide-react";
import { GroupsClient } from "./GroupsClient";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .order("sort_order", { ascending: true });

  const safeGroups: Group[] = groups ?? [];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users size={20} className="text-milestone-blue" />
            Groups
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Organize your goals by life area · {safeGroups.length} groups
          </p>
        </div>
        <GroupsClient groups={safeGroups} />
      </div>
    </AppShell>
  );
}
