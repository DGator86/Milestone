import TopNav from "./TopNav";
import FloatingAssistant from "@/components/ai/FloatingAssistant";
import { ToastProvider } from "@/lib/toast-context";
import { getSettings } from "@/lib/settings";
import { getIsAdmin } from "@/lib/admin";
import type { AppUser } from "@/lib/types";

export default async function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  const [settings, isAdmin] = await Promise.all([getSettings(user.id), getIsAdmin(user.id)]);

  return (
    <ToastProvider>
      <div
        className="brand-scope min-h-screen bg-milestone-bg flex flex-col"
        style={{ ["--brand" as string]: settings.brandColor }}
      >
        <TopNav user={user} terms={settings.terms} companyName={settings.companyName} brandColor={settings.brandColor} isAdmin={isAdmin} />
        <main className="flex-1 min-w-0 min-h-0">{children}</main>
        <FloatingAssistant />
      </div>
    </ToastProvider>
  );
}
