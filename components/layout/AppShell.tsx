import Sidebar from "./Sidebar";
import type { User } from "@supabase/supabase-js";

export default function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-milestone-bg">
      <Sidebar user={user} />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
