import { NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function GET() {
  const results: Record<string, unknown> = { url: SUPABASE_URL };

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    results.auth_health = { status: res.status, ok: res.ok };
  } catch (err: unknown) {
    const e = err as Error & { cause?: unknown };
    results.auth_health_error = {
      message: e?.message,
      cause: String(e?.cause),
    };
  }

  try {
    const res = await fetch("https://www.google.com", { method: "HEAD" });
    results.google_reachable = res.status;
  } catch (err: unknown) {
    const e = err as Error & { cause?: unknown };
    results.google_error = { message: e?.message, cause: String(e?.cause) };
  }

  return NextResponse.json(results);
}
