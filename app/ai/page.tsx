import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { goals, contacts } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import AppShell from "@/components/layout/AppShell";
import { ollamaChat, ollamaConfigured, OLLAMA_MODEL } from "@/lib/ollama";
import { Bot, TrendingUp, AlertTriangle, CheckCircle2, Zap, Users } from "lucide-react";
import type { AppUser, GoalWithDetails } from "@/lib/types";
import AiClient from "./AiClient";

export const dynamic = "force-dynamic";

interface FocusItem {
  type: "action" | "watch" | "celebrate";
  title: string;
  detail: string;
}

interface CoachReport {
  headline: string;
  focusItems: FocusItem[];
  contactNudge: string | null;
  weeklyTip: string;
}

const FOCUS_STYLES = {
  action: { icon: Zap, bg: "bg-milestone-blue-dim", text: "text-milestone-blue", label: "Do this" },
  watch: { icon: AlertTriangle, bg: "bg-milestone-amber-dim", text: "text-milestone-amber", label: "Watch out" },
  celebrate: { icon: CheckCircle2, bg: "bg-milestone-green-dim", text: "text-milestone-green", label: "Win" },
} as const;

async function getCoachReport(
  goalsList: GoalWithDetails[],
  contactCount: number,
  overdueCount: number,
): Promise<CoachReport | null> {
  if (!ollamaConfigured()) return null;

  const goalSummary = goalsList
    .slice(0, 10)
    .map((g) => {
      const ms = g.milestones ?? [];
      const done = ms.filter((m) => m.status === "completed").length;
      const stuck = ms.filter((m) => m.status === "stuck").length;
      return `- "${g.title}" (${g.status}): ${done}/${ms.length} milestones done${stuck ? `, ${stuck} stuck` : ""}`;
    })
    .join("\n");

  try {
    const text = await ollamaChat(
      [
        {
          role: "system",
          content:
            "You are a concise goal coach. Return ONLY valid JSON matching the schema provided. No markdown, no explanation.",
        },
        {
          role: "user",
          content: `User data:\nGoals:\n${goalSummary || "No goals yet."}\nContacts: ${contactCount} total, ${overdueCount} overdue for follow-up.\n\nReturn a JSON object with exactly this shape:\n{\n  "headline": "one-sentence status summary (max 12 words)",\n  "focusItems": [\n    { "type": "action", "title": "short title (4-6 words)", "detail": "one sentence max 20 words" }\n  ],\n  "contactNudge": "one sentence about follow-ups or null",\n  "weeklyTip": "one actionable tip max 20 words"\n}\n\ntype must be one of: action, watch, celebrate. Include 2-4 focus items.`,
        },
      ],
      true,
    );

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as CoachReport;
  } catch {
    return null;
  }
}

export default async function AIPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const user: AppUser = { id: userId, email: session.user.email };

  const [goalsRaw, contactsRaw] = await Promise.all([
    db.query.goals.findMany({
      where: and(eq(goals.user_id, userId), eq(goals.status, "active")),
      with: { groups: true, milestones: true },
      orderBy: [desc(goals.created_at)],
      limit: 10,
    }),
    db.query.contacts.findMany({
      where: and(eq(contacts.user_id, userId), eq(contacts.status, "active")),
      orderBy: [desc(contacts.created_at)],
    }),
  ]);

  const goalsList = goalsRaw.map((g) => ({
    ...g,
    groups: g.groups!,
    milestones: [...(g.milestones ?? [])].sort((a, b) => a.position - b.position),
  })) as GoalWithDetails[];

  const overdueCount = contactsRaw.filter((contact) => {
    if (contact.touch_frequency_days === null) return false;
    if (!contact.last_touched_at) return true;
    const days = Math.floor((Date.now() - new Date(contact.last_touched_at).getTime()) / 86400000);
    return days >= contact.touch_frequency_days;
  }).length;

  const report = await getCoachReport(goalsList, contactsRaw.length, overdueCount);
  const notConfigured = !ollamaConfigured();

  return (
    <AppShell user={user}>
      <div className="p-4 md:p-6 max-w-2xl space-y-6">
        <div>
          <div className="mb-6 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">AI Coach</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {report ? `Powered by ${OLLAMA_MODEL} · refreshes on every visit` : "Personalized goal analysis"}
              </p>
            </div>
          </div>

          {notConfigured && (
            <div className="bg-milestone-amber-dim border border-milestone-amber/20 rounded-xl px-5 py-4 mb-4 space-y-1">
              <p className="text-sm font-semibold text-milestone-amber">Ollama not connected</p>
              <p className="text-xs text-milestone-amber/80">
                Set <code className="bg-white/60 px-1 rounded">OLLAMA_BASE_URL</code> in your Vercel environment variables to the URL of your Ollama server.
              </p>
              <p className="text-xs text-milestone-amber/80">
                Then run: <code className="bg-white/60 px-1 rounded">ollama pull llama3.2:3b</code> on that server.
              </p>
            </div>
          )}

          {report ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-milestone-line shadow-card px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-milestone-blue" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                </div>
                <p className="text-base font-bold text-gray-900">{report.headline}</p>
                <div className="flex gap-4 mt-3 pt-3 border-t border-milestone-line">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{goalsList.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Active goals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{contactsRaw.length}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Contacts</p>
                  </div>
                  {overdueCount > 0 && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-milestone-red tabular-nums">{overdueCount}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Overdue</p>
                    </div>
                  )}
                </div>
              </div>

              {report.focusItems?.length > 0 && (
                <div className="bg-white rounded-xl border border-milestone-line shadow-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-milestone-line bg-gray-50/60">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Focus</p>
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
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>
                              {style.label}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {report.contactNudge && (
                <div className="bg-white rounded-xl border border-milestone-line shadow-card px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-milestone-blue" />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Contacts</span>
                  </div>
                  <p className="text-sm text-gray-700">{report.contactNudge}</p>
                </div>
              )}

              {report.weeklyTip && (
                <div className="bg-milestone-blue-dim rounded-xl px-5 py-4 flex items-start gap-3">
                  <Zap size={16} className="text-milestone-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-milestone-blue mb-0.5">Coach tip</p>
                    <p className="text-sm text-gray-700">{report.weeklyTip}</p>
                  </div>
                </div>
              )}
            </div>
          ) : !notConfigured ? (
            <div className="bg-white rounded-xl border border-milestone-line shadow-card p-10 text-center">
              <Bot size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400">Could not generate report — is Ollama running?</p>
              <p className="text-xs text-gray-300 mt-1">Check that your server is reachable and the model is pulled.</p>
            </div>
          ) : null}
        </div>

        <AiClient />
      </div>
    </AppShell>
  );
}
