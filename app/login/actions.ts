"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  let authError: string | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (error) authError = error.message;
  } catch (err: unknown) {
    const e = err as Error & { cause?: unknown };
    console.error("signIn fetch failed:", {
      url: SUPABASE_URL,
      message: e?.message,
      cause: String(e?.cause),
      stack: e?.stack?.split("\n").slice(0, 3).join(" | "),
    });
    authError = `Network error: ${e?.message} — cause: ${String(e?.cause)}`;
  }

  if (authError) {
    redirect(`/login?error=${encodeURIComponent(authError)}`);
  }

  // Bust the client-side router cache so the post-login navigation fetches
  // fresh RSC data and the middleware sees the new session cookie.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
