import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { FileText, ChevronRight, ArrowRight } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText size={20} className="text-milestone-blue" />
            Templates
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Start from a proven milestone structure — customise after
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className={`bg-gradient-to-br ${tpl.color} rounded-xl border p-5 flex flex-col gap-4 hover:shadow-card-lg transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xl leading-none">{tpl.icon}</span>
                  <h3 className="text-sm font-bold text-gray-900 mt-2">{tpl.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{tpl.description}</p>
                </div>
              </div>

              {/* Milestone preview */}
              <div className="space-y-1.5">
                {tpl.milestones.map((ms, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-gray-400">{i + 1}</span>
                    </div>
                    <span className="text-xs text-gray-600 truncate">{ms}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-black/5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 capitalize">
                  {tpl.goal_type}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 capitalize">
                  {tpl.importance}
                </span>
                <Link
                  href={`/dashboard?tpl=${tpl.id}#create-goal`}
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-milestone-blue hover:text-blue-700 transition-colors"
                >
                  Use
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-card border border-milestone-line p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
              <ChevronRight size={18} className="text-milestone-blue" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Start from scratch</p>
              <p className="text-xs text-gray-400 mt-0.5">Create a goal with custom milestones</p>
            </div>
            <Link
              href="/dashboard#create-goal"
              className="flex items-center gap-1.5 bg-milestone-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shrink-0"
            >
              New Goal
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
