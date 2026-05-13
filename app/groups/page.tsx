import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import AddGroupForm from "@/components/groups/AddGroupForm";
import { Users, Briefcase, Home, Heart, Target } from "lucide-react";
import type { Group } from "@/lib/types";

export const dynamic = "force-dynamic";

const GROUP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Work: Briefcase,
  Home: Home,
  Health: Heart,
};

const GROUP_BG: Record<string, string> = {
  Work: "from-blue-50 to-indigo-50 border-blue-100",
  Home: "from-amber-50 to-orange-50 border-amber-100",
  Health: "from-green-50 to-emerald-50 border-green-100",
};

const GROUP_ICON_COLOR: Record<string, string> = {
  Work: "text-milestone-blue bg-milestone-blue-dim",
  Home: "text-milestone-amber bg-milestone-amber-dim",
  Health: "text-milestone-green bg-milestone-green-dim",
};

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

  const { data: goals } = await supabase
    .from("goals")
    .select("id, group_id, status")
    .eq("status", "active");

  const safeGroups: Group[] = groups ?? [];
  const goalCountByGroup: Record<string, number> = {};
  for (const g of goals ?? []) {
    goalCountByGroup[g.group_id] = (goalCountByGroup[g.group_id] ?? 0) + 1;
  }

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Users size={20} className="text-milestone-blue" />
              Groups
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Organize your goals by life area</p>
          </div>
        </div>

        {safeGroups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card border border-milestone-line p-14 text-center mb-4">
            <Users size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No groups yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {safeGroups.map((group) => {
              const Icon = GROUP_ICONS[group.name] ?? Target;
              const iconColor =
                GROUP_ICON_COLOR[group.name] ?? "text-gray-500 bg-gray-100";
              const cardBg =
                GROUP_BG[group.name] ?? "from-gray-50 to-gray-50 border-gray-100";
              const count = goalCountByGroup[group.id] ?? 0;

              return (
                <div
                  key={group.id}
                  className={`bg-gradient-to-br ${cardBg} rounded-xl border p-5 flex items-center gap-4 hover:shadow-card-lg transition-shadow`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {count === 0
                        ? "No active goals"
                        : `${count} active goal${count === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <AddGroupForm />
      </div>
    </AppShell>
  );
}
