import TopNav from "./TopNav";
import { ToastProvider } from "@/lib/toast-context";
import type { User } from "@supabase/supabase-js";

export default function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-milestone-bg flex flex-col">
        <TopNav user={user} />
        <main className="flex-1 min-w-0 min-h-0">{children}</main>
      </div>
    </ToastProvider>
  );
}
