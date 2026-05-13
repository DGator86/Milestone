import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Bot } from "lucide-react";
import AiClient from "./AiClient";

export const dynamic = "force-dynamic";

export default async function AIPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bot size={20} className="text-milestone-blue" />
            AI Assistant
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Describe a goal — get a milestone plan instantly
          </p>
        </div>
        <AiClient />
      </div>
    </AppShell>
  );
}
