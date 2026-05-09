import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <ComingSoon
        icon={<FileText size={40} className="text-milestone-amber" />}
        title="Templates"
        description="Pre-built goal blueprints for common objectives — launch a product, run a marathon, close a sales cycle. One click to spin up a fully structured goal."
        features={[
          "50+ curated goal templates",
          "Work, Home & Health categories",
          "Save your own as reusable templates",
        ]}
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
            <div className="w-1.5 h-1.5 rounded-full bg-milestone-amber shrink-0" />
            {f}
          </div>
        ))}
      </div>
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-milestone-amber-dim text-milestone-amber text-xs font-bold uppercase tracking-widest">
        Coming Soon
      </span>
    </div>
  );
}
