import Link from "next/link";
import { Zap, ClipboardList } from "lucide-react";

export default function SetupPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
        />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-milestone-blue mb-4 shadow-lg shadow-blue-900/50">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Configure Supabase</h1>
          <p className="text-white/40 text-sm mt-1">
            Milestone needs your project URL and anon key before it can run.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] p-7 space-y-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-milestone-blue-dim flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-milestone-blue" />
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Copy <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env.example</code> to{" "}
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env.local</code> in the project root.
              </p>
              <p>
                Set <span className="font-semibold text-gray-800">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
                <span className="font-semibold text-gray-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> from your Supabase
                project: Settings → API.
              </p>
              <p className="text-xs text-gray-400">
                Replace placeholder values from the example file with your real credentials, then run{" "}
                <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">npm run dev</code> again.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 border-t border-milestone-line pt-4">
            Apply <code className="bg-gray-100 px-1 rounded">supabase/schema.sql</code> in the Supabase SQL Editor so
            tables and <code className="bg-gray-100 px-1 rounded">ensure_default_groups</code> exist.
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="https://supabase.com/dashboard"
              className="block text-center w-full bg-milestone-blue text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Supabase dashboard
            </Link>
            <Link
              href="/login"
              className="block text-center text-sm text-milestone-blue font-semibold hover:underline py-2"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
