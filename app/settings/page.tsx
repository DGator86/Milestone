import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const sb = await createClient();
    await sb.auth.signOut();
    redirect("/login");
  }

  return (
    <AppShell user={user}>
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings size={22} className="text-milestone-blue" />
          Settings
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-milestone-line p-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <hr className="border-milestone-line" />
          <form action={signOut}>
            <button
              type="submit"
              className="bg-milestone-red text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
