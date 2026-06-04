import TopNav from "./TopNav";
import FloatingAssistant from "@/components/ai/FloatingAssistant";
import { ToastProvider } from "@/lib/toast-context";
import { getSettings } from "@/lib/settings";
import type { AppUser } from "@/lib/types";

export default async function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  const settings = await getSettings(user.id);

  return (
    <ToastProvider>
      <div
        className="brand-scope min-h-screen bg-milestone-bg flex flex-col"
        style={{ ["--brand" as string]: settings.brandColor }}
      >
        <TopNav user={user} terms={settings.terms} companyName={settings.companyName} brandColor={settings.brandColor} />
        <main className="flex-1 min-w-0 min-h-0">{children}</main>
        <FloatingAssistant />
      </div>
    </ToastProvider>
  );
}
