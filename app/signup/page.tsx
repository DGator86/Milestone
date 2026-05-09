import Link from "next/link";
import { Zap, Check } from "lucide-react";
import { signUp } from "./actions";

const perks = [
  "Organize goals by Work, Home & Health",
  "Visual milestone progress tracking",
  "Daily momentum & streak logging",
];

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Brand */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue mb-4 shadow-lg shadow-blue-900/50">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Milestone</h1>
          <p className="text-white/40 text-sm mt-1">Track the path. Kill the next step.</p>
        </div>

        {/* Perk list */}
        <div className="space-y-2 mb-7">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2.5 text-white/60 text-xs">
              <div className="w-4 h-4 rounded-full bg-milestone-green/20 flex items-center justify-center shrink-0">
                <Check size={10} className="text-milestone-green" strokeWidth={3} />
              </div>
              {perk}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-7">
          <h2 className="text-[18px] font-bold text-gray-900 mb-0.5">Create your account</h2>
          <p className="text-sm text-gray-400 mb-5">Free to start · no credit card needed</p>

          <form action={signUp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent text-sm transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full px-3.5 py-2.5 border border-milestone-line rounded-lg focus:outline-none focus:ring-2 focus:ring-milestone-blue focus:border-transparent text-sm transition-all"
                placeholder="Min 6 characters"
              />
            </div>

            <ErrorMessage searchParams={searchParams} />

            <button
              type="submit"
              className="w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm shadow-blue-200 mt-1"
            >
              Get started
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-milestone-blue font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3.5 py-2.5">
      {params.error}
    </div>
  );
}
