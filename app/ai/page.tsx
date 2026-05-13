import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import { Bot, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

const SAMPLE_PROMPTS = [
  "What's blocking my most important goal right now?",
  "Which goals am I at risk of missing this month?",
  "Suggest milestones for learning a new skill",
  "How can I improve my weekly momentum?",
];

export default async function AIPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={user}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-full max-w-xl text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
            <Bot size={36} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h1>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed mb-8">
            Your personal goal coach — powered by AI. Ask anything about your goals,
            get suggestions, identify risks, and stay on track.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Target, label: "Goal coaching", color: "text-milestone-blue bg-milestone-blue-dim" },
              { icon: TrendingUp, label: "Risk detection", color: "text-milestone-red bg-milestone-red-dim" },
              { icon: Zap, label: "Smart suggestions", color: "text-milestone-amber bg-milestone-amber-dim" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="bg-white border border-milestone-line rounded-xl p-4 flex flex-col items-center gap-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-xs font-semibold text-gray-600 text-center">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Sample questions
          </p>
          <div className="flex flex-col gap-2 mb-8">
            {SAMPLE_PROMPTS.map((prompt) => (
              <div
                key={prompt}
                className="flex items-center gap-3 bg-white border border-milestone-line rounded-xl px-4 py-3 text-sm text-gray-500 text-left cursor-not-allowed opacity-70"
              >
                <Sparkles size={14} className="text-milestone-blue shrink-0" />
                {prompt}
              </div>
            ))}
          </div>

          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-milestone-blue-dim text-milestone-blue text-xs font-bold uppercase tracking-widest">
            Coming Soon
          </span>
        </div>
      </div>
    </AppShell>
  );
}
