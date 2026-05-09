import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppComingSoon from "@/components/AppComingSoon";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppComingSoon
      user={user}
      title="Templates"
      subtitle="Reusable goal and milestone patterns"
      icon={FileText}
    />
  );
}
