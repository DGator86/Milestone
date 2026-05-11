import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import Anthropic from "@anthropic-ai/sdk";
import { Bot, TrendingUp, AlertTriangle, CheckCircle2, Zap, Users } from "lucide-react";
import type { GoalWithDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CoachReport {
  headline: string;
  focusItems: { type: "action" | "watch" | "celebrate"; title: string; detail: string }[];
  contactNudge: string | null;
  weeklyTip: string;
}

const FOCUS_STYLES = {
  action: { icon: Zap, bg: "bg-milestone-blue-dim", text: "text-milestone-blue", label: "Do this" },
  watch: { icon: AlertTriangle, bg: "bg-milestone-amber-dim", text: "text-milestone-amber", label: "Watch out" },
  celebrate: { icon: CheckCircle2, bg: "bg-milestone-green-dim", text: "text-milestone-green", label: "Win" },
};

async function getCoachReport(
  goals: GoalWithDetails[],
  contactCount: number,
  overdueCount: number
): Promise<CoachReport | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const goalSummary = goals.slice(0, 10).map((g) => {
    const ms = (g.milestones ?? []);
    const done = ms.filter((m) => m.status === "completed").length;
    const stuck = ms.filter((m) => m.status === "stuck").length;
    return `- "${g.title}" (${g.status}): ${done}/${ms.length} milestones done${stuck ? `, ${stuck} stuck` : ""}`;
  }).join("\n");

  const client = new Anthropic();

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: "You are a sharp, concise goal coach. Be direct and practical. Return only valid JSON.",
    messages: [
      {
        role: "user",
        content: `User data:
Goals:
${goalSummary || "No goals yet."}
Contacts: ${contactCount} total, ${overdueCount} overdue for follow-up.

Return a JSON object with exactly this shape:
{
  "headline": "one-sentence status summary (max 12 words)",
  "focusItems": [
    { "type": "action|watch|celebrate", "title": "short title (4-6 words)", "detail": "one sentence (max 20 words)" }
  ],
  "contactNudge": "one sentence about contact follow-ups, or null if no contacts",
  "weeklyTip": "one actionable productivity tip (max 20 words)"
}

Include 2-4 focus items based on the data. If no goals, give onboarding-style suggestions.`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

export default async function AIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: goalsRaw }, { data: contactsRaw }] = await Promise.all([
    supabase
      .from("goals")
      .select("*, groups(*), milestones(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("contacts")
      .select("touch_frequency_days, last_touched_at")
      .eq("status", "active")
      .not("touch_frequency_days", "is", null),
  ]);

  const goals: GoalWithDetails[] = (goalsRaw ?? []).map((g) => ({
    ...g,
    milestones: [...(g.milestones ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position
    ),
  }));

  const contacts = contactsRaw ?? [];
  const now = Date.now();
  const overdueCount = contacts.filter((c) => {
    const days = c.last_touched_at
      ? Math.floor((now - new Date(c.last_touched_at).getTime()) / 86400000)
      : null;
    return days === null || days >= c.touch_frequency_days;
  }).length;

  const report = await getCoachReport(goals, contacts.length, overdueCount);

  const noApiKey = !process.env.ANTHROPIC_API_KEY;

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-2xl">
        <div className="mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">AI Coach</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {report ? "Personalized analysis of your goals and contacts" : "Your personal goal coach"}
            </p>
          </div>
        </div>

        {noApiKey && (
          <div className="bg-milestone-amber-dim border border-milestone-amber/20 rounded-xl px-5 py-4 mb-4">
            <p className="text-sm font-semibold text-milestone-amber">ANTHROPIC_API_KEY not set</p>
            <p className="text-xs text-milestone-amber/80 mt-0.5">
              Add it to your Vercel environment variables to enable AI features.
            </p>
          </div>
        )}

        {report ? (
          <div className="space-y-4">
            {/* Headline */}
            <div className="bg-white rounded-xl border border-milestone-line shadow-card px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-milestone-blue" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</span>
              </div>
              <p className="text-base font-bold text-gray-900">{report.headline}</p>
              <div className="flex gap-4 mt-3 pt-3 border-t border-milestone-line">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{goals.length}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Active goals</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{contacts.length}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Contacts</p>
                </div>
                {overdueCount > 0 && (
                  <div className="text-center">
                    <p className="text-xl font-bold text-milestone-red tabular-nums">{overdueCount}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Overdue follow-ups</p>
                  </div>
                )}
              </div>
            </div>

            {/* Focus items */}
            {report.focusItems?.length > 0 && (
              <div className="bg-white rounded-xl border border-milestone-line shadow-card overflow-hidden">
                <div className="px-5 py-3 border-b border-milestone-line bg-gray-50/60">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    Focus
                  </p>
                </div>
                <div className="divide-y divide-milestone-line">
                  {report.focusItems.map((item, i) => {
                    const style = FOCUS_STYLES[item.type] ?? FOCUS_STYLES.action;
                    const Icon = style.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 px-5 py-4">
                        <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={15} className={style.text} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact nudge */}
            {report.contactNudge && (
              <div className="bg-white rounded-xl border border-milestone-line shadow-card px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-milestone-blue" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Contacts</span>
                </div>
                <p className="text-sm text-gray-700">{report.contactNudge}</p>
              </div>
            )}

            {/* Weekly tip */}
            {report.weeklyTip && (
              <div className="bg-milestone-blue-dim rounded-xl px-5 py-4 flex items-start gap-3">
                <Zap size={16} className="text-milestone-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-milestone-blue mb-0.5">
                    Coach tip
                  </p>
                  <p className="text-sm text-gray-700">{report.weeklyTip}</p>
                </div>
              </div>
            )}
          </div>
        ) : !noApiKey ? (
          <div className="bg-white rounded-xl border border-milestone-line shadow-card p-10 text-center">
            <Bot size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">Could not generate coaching report.</p>
            <p className="text-xs text-gray-300 mt-1">Try refreshing the page.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-milestone-line shadow-card p-10 text-center">
            <Bot size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">Add your API key to get started.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
