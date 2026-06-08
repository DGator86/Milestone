import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { user_settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Zap } from "lucide-react";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Skip onboarding if already completed
  const settingsRow = await db.query.user_settings.findFirst({
    where: eq(user_settings.user_id, session.user.id),
  });
  if (settingsRow?.onboarding_completed_at) redirect("/dashboard");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2040 0%, #07111F 65%)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #1769FF 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-[#1769FF] mb-4 shadow-lg shadow-blue-900/50">
            <Zap size={22} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Milestone</h1>
          <p className="text-white/40 text-sm mt-1">Track the path. Kill the next step.</p>
        </div>

        <OnboardingWizard email={session.user.email ?? ""} />
      </div>
    </div>
  );
}
