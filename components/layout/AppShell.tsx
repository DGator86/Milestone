import Sidebar from "./Sidebar";
import { ToastProvider } from "@/lib/toast-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import type { User } from "@supabase/supabase-js";

export default function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-milestone-bg">
          <Sidebar user={user} />
          <main className="flex-1 min-w-0 overflow-auto">{children}</main>
        </div>
      </ToastProvider>
    </SidebarProvider>
  );
}
