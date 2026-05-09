import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <ComingSoon
        icon={<Clock size={40} className="text-milestone-blue" />}
        title="Timeline"
        description="A chronological view of every milestone across all your goals — see what's due this week, next week, and beyond."
        features={["Gantt-style date bands", "Overdue alerts", "Drag-to-reschedule milestones"]}
      />
    </AppShell>
  );
}

function ComingSoon({
  icon,
  title,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white shadow-card border border-milestone-line flex items-center justify-center mb-5">
        {icon}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">{description}</p>
      <div className="flex flex-col gap-2 mb-8">
        {features.map((f) => (
          <div
            key={f}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-milestone-line rounded-lg px-4 py-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-milestone-blue shrink-0" />
            {f}
          </div>
        ))}
      </div>
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-milestone-blue-dim text-milestone-blue text-xs font-bold uppercase tracking-widest">
        Coming Soon
      </span>
    </div>
  );
}
