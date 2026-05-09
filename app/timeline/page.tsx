import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppComingSoon from "@/components/AppComingSoon";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppComingSoon
      user={user}
      title="Timeline"
      subtitle="Chronological view of milestones and activity"
      icon={Clock}
    />
  );
}
