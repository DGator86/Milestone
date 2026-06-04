import TopNav from "./TopNav";
import FloatingAssistant from "@/components/ai/FloatingAssistant";
import { ToastProvider } from "@/lib/toast-context";
import type { AppUser } from "@/lib/types";

export default function AppShell({
  user,
  children,
}: {
  user: AppUser;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-milestone-bg flex flex-col">
        <TopNav user={user} />
        <main className="flex-1 min-w-0 min-h-0">{children}</main>
        <FloatingAssistant />
      </div>
    </ToastProvider>
  );
}
