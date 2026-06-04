import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { Settings, User, LogOut } from "lucide-react";
import { signOutAction } from "@/app/auth-actions";
import { getSettings } from "@/lib/settings";
import WorkspaceSettingsForm from "@/components/settings/WorkspaceSettingsForm";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: AppUser = { id: session.user.id, email: session.user.email };
  const settings = await getSettings(user.id);

  const username = user.email?.split("@")[0] ?? "User";
  const initial = username[0].toUpperCase();

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings size={20} className="text-milestone-blue" />
            Settings
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Customize your workspace, branding, and preferences</p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-gray-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <User size={12} />
                Account
              </p>
            </div>
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-milestone-blue/30 flex items-center justify-center shrink-0 ring-1 ring-milestone-blue/20">
                <span className="text-milestone-blue text-lg font-bold">{initial}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{username}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-milestone-blue-dim text-milestone-blue">
                  Pro Plan
                </span>
              </div>
            </div>
          </div>

          <WorkspaceSettingsForm
            companyName={settings.companyName}
            brandColor={settings.brandColor}
            terms={settings.terms}
            preferences={settings.preferences}
          />

          <div className="bg-white rounded-xl shadow-card border border-milestone-line overflow-hidden">
            <div className="px-5 py-3.5 border-b border-milestone-line bg-red-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-milestone-red/70 flex items-center gap-1.5">
                <LogOut size={12} />
                Session
              </p>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Sign out</p>
                <p className="text-xs text-gray-400">End your current session</p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="bg-milestone-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
