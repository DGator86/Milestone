import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppComingSoon from "@/components/AppComingSoon";
import { Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppComingSoon
      user={user}
      title="AI Assistant"
      subtitle="Suggestions and planning help for your goals"
      icon={Bot}
    />
  );
}
