import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import {
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  BarChart2,
} from "lucide-react";

export default async function Home() {
  if (!isSupabaseConfigured()) {
    redirect("/setup");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#07111F] text-white overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] rounded-full opacity-[0.13]"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-[55%] -left-[15%] w-[700px] h-[700px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #36A852 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #F8B400 0%, transparent 65%)" }}
        />
      </div>

      {/* ── Nav ── */}
      <header className="relative z-50 sticky top-0 border-b border-white/[0.06] backdrop-blur-xl bg-[#07111F]/75">
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-[#1769FF] flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Zap size={15} className="text-white fill-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">Milestone</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-white/50 hover:text-white/90 transition-colors font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-white/50 hover:text-white/90 transition-colors font-medium">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-white/55 hover:text-white/90 transition-colors font-medium px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 bg-[#1769FF] hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-blue-900/30"
            >
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1769FF]/10 border border-[#1769FF]/25 text-[#5b93ff] rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1769FF] animate-pulse" />
          Goal CRM — Built differently
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-[72px] font-black tracking-tight leading-[1.04] mb-6">
          Track the path.
          <br />
          <span
            style={{
              background: "linear-gradient(125deg, #1769FF 0%, #60a5fa 45%, #36A852 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Kill the next step.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
          Milestone breaks every goal into sequential milestones, shows you exactly what to do
          next, and makes progress feel real.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-[#1769FF] hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-xl hover:shadow-blue-900/40 group w-full sm:w-auto justify-center"
          >
            Start for free
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-white/55 hover:text-white px-7 py-3.5 rounded-xl text-base font-medium border border-white/[0.09] hover:border-white/20 transition-all w-full sm:w-auto justify-center"
          >
            Sign in to your account
          </Link>
        </div>

        {/* App preview mockup */}
        <div className="relative mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/[0.07] bg-[#0B1929] shadow-[0_48px_120px_rgba(0,0,0,0.65)] overflow-hidden">
            {/* Fake window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.05] bg-[#0d1f35]">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              <div className="flex-1 mx-4">
                <div className="bg-white/[0.05] rounded-md h-5 max-w-[180px] mx-auto" />
              </div>
            </div>
            {/* Fake app layout */}
            <div className="flex" style={{ height: "300px" }}>
              {/* Sidebar */}
              <div className="w-[52px] bg-[#0B1929] border-r border-white/[0.04] flex flex-col items-center py-4 gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-[#1769FF]/30 border border-blue-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-blue-400/60" />
                </div>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-md ${i === 0 ? "bg-white/20" : "bg-white/[0.04]"}`}
                  />
                ))}
              </div>
              {/* Content */}
              <div className="flex-1 p-5 space-y-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="h-4 w-20 bg-white/10 rounded mb-1" />
                    <div className="h-2.5 w-32 bg-white/[0.05] rounded" />
                  </div>
                  <div className="h-7 w-22 bg-[#1769FF]/25 rounded-lg border border-[#1769FF]/20 px-3 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#1769FF]/60" />
                    <div className="h-2 w-12 bg-white/15 rounded" />
                  </div>
                </div>
                {/* Goal rows */}
                {[
                  { pct: 67, color: "#1769FF", nodes: [true, true, true, false, false] },
                  { pct: 40, color: "#36A852", nodes: [true, true, false, false, false] },
                  { pct: 100, color: "#36A852", nodes: [true, true, true, true, true] },
                  { pct: 20, color: "#F8B400", nodes: [true, false, false, false, false] },
                ].map((goal, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2.5 flex items-center gap-3"
                  >
                    <div className="w-16 h-2.5 bg-white/[0.08] rounded shrink-0" />
                    <div className="flex-1 flex items-center">
                      {goal.nodes.map((done, j) => (
                        <div key={j} className="flex items-center flex-1">
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                            style={{
                              borderColor: done ? goal.color : "rgba(255,255,255,0.1)",
                              backgroundColor: done ? goal.color : "transparent",
                            }}
                          >
                            {done && <div className="w-1.5 h-1.5 rounded-full bg-white/80" />}
                          </div>
                          {j < goal.nodes.length - 1 && (
                            <div
                              className="flex-1 h-px mx-0.5"
                              style={{
                                backgroundColor:
                                  done && goal.nodes[j + 1]
                                    ? goal.color
                                    : "rgba(255,255,255,0.06)",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <span
                      className="text-[11px] font-bold tabular-nums shrink-0 w-8 text-right"
                      style={{ color: goal.color }}
                    >
                      {goal.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-12 opacity-25 blur-2xl rounded-full"
            style={{ background: "linear-gradient(90deg, #1769FF, #36A852)" }}
          />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Everything you need to
            <br />
            <span className="text-white/35">stop losing goals.</span>
          </h2>
          <p className="text-white/35 text-base max-w-md mx-auto leading-relaxed">
            Built for people who finish things. No project management theater.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Target,
              color: "#1769FF",
              title: "Milestone Paths",
              description:
                "Break every goal into sequential steps. One active step at a time. Always know exactly what's next.",
            },
            {
              icon: TrendingUp,
              color: "#36A852",
              title: "Momentum Tracking",
              description:
                "Build daily streaks. Watch progress compound. Never forget where you left off on any goal.",
            },
            {
              icon: BarChart2,
              color: "#F8B400",
              title: "Task Health",
              description:
                "Instantly see stuck, needs-attention, and on-track goals. Nothing falls through the cracks.",
            },
            {
              icon: Layers,
              color: "#1769FF",
              title: "Goal Groups",
              description:
                "Work, Home, Health — each in its own context. Organized so nothing bleeds into everything else.",
            },
            {
              icon: Shield,
              color: "#EA4335",
              title: "Kill List",
              description:
                "Cut goals that don't deserve your time. Focus is a feature. Ruthless prioritization, built in.",
            },
            {
              icon: CheckCircle,
              color: "#36A852",
              title: "One-Click Progress",
              description:
                "Click a milestone node to mark it done. Instant visual feedback. Zero friction, maximum momentum.",
            },
          ].map(({ icon: Icon, color, title, description }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-default"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-0.5"
                style={{
                  backgroundColor: `${color}14`,
                  border: `1px solid ${color}22`,
                }}
              >
                <Icon size={19} style={{ color }} />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">How it works</h2>
          <p className="text-white/35 text-base max-w-sm mx-auto">
            Three steps to goals that actually move.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            {
              step: "01",
              color: "#1769FF",
              title: "Create a goal",
              description: "Name your goal, pick a group, set the type. Takes 30 seconds.",
            },
            {
              step: "02",
              color: "#F8B400",
              title: "Define milestones",
              description:
                "Break it into 2–6 sequential steps. Each step is one specific, clear action.",
            },
            {
              step: "03",
              color: "#36A852",
              title: "Execute daily",
              description:
                "Open your dashboard, see the next step, click done. Build momentum every day.",
            },
          ].map(({ step, color, title, description }) => (
            <div
              key={step}
              className="relative p-7 rounded-2xl border border-white/[0.07] bg-white/[0.02]"
            >
              <div
                className="text-6xl font-black mb-5 leading-none select-none"
                style={{ color: `${color}20` }}
              >
                {step}
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{description}</p>
              <div
                className="absolute top-7 right-7 w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="relative rounded-3xl overflow-hidden p-12 sm:p-16 text-center border border-white/[0.08]"
          style={{
            background:
              "linear-gradient(135deg, rgba(23,105,255,0.14) 0%, rgba(54,168,82,0.07) 100%)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 blur-3xl rounded-full"
              style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
            />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Stop losing goals to the void.
            </h2>
            <p className="text-white/40 text-base mb-8 max-w-sm mx-auto leading-relaxed">
              Free to start. No credit card required. Just goals that actually move forward.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#1769FF] hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:shadow-xl hover:shadow-blue-900/50 group"
            >
              Create your account
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-400 to-[#1769FF] flex items-center justify-center">
              <Zap size={11} className="text-white fill-white" />
            </div>
            <span className="text-sm font-semibold text-white/30">Milestone</span>
          </div>
          <p className="text-xs text-white/18">Track the path. Kill the next step.</p>
        </div>
      </footer>
    </div>
  );
}
